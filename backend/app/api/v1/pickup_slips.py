import os
from io import BytesIO
from datetime import date, datetime, time
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
import anyio

from app.db.session import get_db
from app.api.deps import get_current_user, get_user_agency_filter, RoleChecker
from app.models.user import User
from app.models.driver import Driver
from app.models.pickup import Pickup
from app.models.pickup_slip import PickupSlip
from app.models.agency import Agency
from app.core.exceptions import NotFoundError, PermissionDeniedError

# Schemas imports
from app.schemas.pickup_slip import PickupSlipCreate, PickupSlipRead, PickupSlipUpdate
from app.schemas.pickup import PickupCreate, PickupRead
from app.schemas.driver import DriverRead
from app.schemas.agency import AgencyRead

# ReportLab imports
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas

router = APIRouter(prefix="/pickup-slips", tags=["Bordereaux de Ramassage"])

def make_numbered_canvas(printed_by: Optional[str] = None, driver_nom: Optional[str] = None):
    class NumberedCanvas(canvas.Canvas):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self._saved_page_states = []

        def showPage(self):
            self._saved_page_states.append(dict(self.__dict__))
            self._startPage()

        def save(self):
            num_pages = len(self._saved_page_states)
            for state in self._saved_page_states:
                self.__dict__.update(state)
                self.draw_page_elements(num_pages)
                super().showPage()
            super().save()

        def draw_page_elements(self, page_count):
            self.saveState()
            
            # Draw page number
            self.setFont("Helvetica", 9)
            self.setFillColor(colors.HexColor("#6B6A63"))
            page_text = f"Page {self._pageNumber} sur {page_count}"
            self.drawRightString(523 + 36, 20, page_text)
            
            # Draw signature boxes ONLY on the last page
            if self._pageNumber == page_count:
                self.setStrokeColor(colors.HexColor("#D8D5CB"))
                self.setLineWidth(0.75)
                
                # Box 1 (Personne qui a fait l'impression)
                user_label = f"Signature : {printed_by}" if printed_by else "Signature Agent"
                self.rect(36, 40, 245, 80, stroke=1, fill=0)
                self.setFont("Helvetica-Bold", 10)
                self.setFillColor(colors.HexColor("#201F1B"))
                self.drawString(46, 103, user_label[:36])
                self.setFont("Helvetica", 8.5)
                self.setFillColor(colors.HexColor("#6B6A63"))
                self.drawString(46, 90, "Horizon Express Services")
                
                # Box 2 (Chauffeur)
                d_name = driver_nom if driver_nom else "Chauffeur"
                driver_label = f"Signature : {d_name}"
                self.rect(314, 40, 245, 80, stroke=1, fill=0)
                self.setFont("Helvetica-Bold", 10)
                self.setFillColor(colors.HexColor("#201F1B"))
                self.drawString(324, 103, driver_label[:36])
                self.setFont("Helvetica", 8.5)
                self.setFillColor(colors.HexColor("#6B6A63"))
                self.drawString(324, 90, "Émargement et accord")
                
            self.restoreState()

    return NumberedCanvas

def _generate_pdf_sync(pickups, driver, date_debut, date_fin, slip_code: Optional[str] = None, printed_by: Optional[str] = None) -> BytesIO:
    # 4. Génération du PDF en mémoire
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=140
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles matching H.E.S corporate colors
    primary_color = colors.HexColor("#0047AB") # Cobalt Blue
    accent_color = colors.HexColor("#DC143C")  # Crimson Red
    neutral_light = colors.HexColor("#F8FAFC")  # Slate Light Gray
    
    title_style = ParagraphStyle(
        'HES_Title',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        textColor=primary_color,
        leading=24
    )
    
    subtitle_style = ParagraphStyle(
        'HES_SubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        textColor=accent_color,
        leading=16
    )

    body_style = ParagraphStyle(
        'HES_Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        textColor=colors.HexColor("#334155"),
        leading=14
    )

    body_bold_style = ParagraphStyle(
        'HES_BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    table_header_style = ParagraphStyle(
        'HES_TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white,
        leading=12
    )

    table_cell_style = ParagraphStyle(
        'HES_TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=colors.HexColor("#1E293B"),
        leading=12
    )

    right_label_style = ParagraphStyle(
        'HES_RightLabel',
        parent=body_bold_style,
        alignment=2, # Right
        fontSize=9,
        textColor=colors.HexColor("#1E293B")
    )
    
    right_value_style = ParagraphStyle(
        'HES_RightValue',
        parent=body_bold_style,
        alignment=1, # Center
        fontSize=10,
        textColor=primary_color
    )

    story = []
    
    # --- HEADER SECTION (Logo + Text side by side) ---
    logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "logo.png"))
    if not os.path.exists(logo_path):
        logo_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "static", "logo.jpg"))
    
    text_header = [
        Paragraph("HORIZON EXPRESS SERVICES", title_style),
        Spacer(1, 4),
        Paragraph("BORDEREAU RÉCAPITULATIF DE RAMASSAGE", subtitle_style)
    ]
    
    if os.path.exists(logo_path):
        logo_img = Image(logo_path, width=60, height=60)
        header_data = [[logo_img, text_header]]
    else:
        header_data = [["[LOGO H.E.S]", text_header]]
        
    header_table = Table(header_data, colWidths=[70, 450])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (1, 0), (1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(header_table)
    
    # Accent line
    line_table = Table([[""]], colWidths=[520], rowHeights=[2])
    line_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), accent_color),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(line_table)
    story.append(Spacer(1, 15))
    
    # --- METADATA SECTION ---
    if date_debut == date_fin:
        date_text = f"<b>Date Tournée :</b> {date_debut.strftime('%d/%m/%Y')}"
    else:
        date_text = f"<b>Période :</b> Du {date_debut.strftime('%d/%m/%Y')} au {date_fin.strftime('%d/%m/%Y')}"

    phone_or_code = f"<b>N° Bordereau :</b> {slip_code}" if slip_code else f"<b>Téléphone :</b> {driver.telephone or 'N/A'}"

    meta_data = [
        [
            Paragraph(f"<b>Chauffeur :</b> {driver.nom}", body_style),
            Paragraph(f"<b>Agence :</b> {driver.agency.nom if driver.agency else 'N/A'}", body_style)
        ],
        [
            Paragraph(phone_or_code, body_style),
            Paragraph(date_text, body_style)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[260, 260])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 15))
    
    # --- PICKUPS TABLE ---
    # Headers: N° BL / Client / Ville / Date / Heure / Colis
    table_data = [[
        Paragraph("N° BL", table_header_style),
        Paragraph("Client", table_header_style),
        Paragraph("Ville", table_header_style),
        Paragraph("Date", table_header_style),
        Paragraph("Heure", table_header_style),
        Paragraph("Colis", table_header_style),
    ]]
    
    total_colis = 0
    for pk in pickups:
        total_colis += pk.nombre_colis
        ville_text = pk.ville if (pk.ville and pk.ville.strip()) else (pk.adresse if (pk.adresse and pk.adresse != "N/A") else (driver.agency.nom if driver.agency else "N/A"))
        table_data.append([
            Paragraph(pk.numero_declaration or "N/A", table_cell_style),
            Paragraph(pk.client_nom or "N/A", table_cell_style),
            Paragraph(ville_text or "N/A", table_cell_style),
            Paragraph(pk.date.strftime("%d/%m/%Y") if pk.date else "N/A", table_cell_style),
            Paragraph(pk.heure.strftime("%H:%M") if pk.heure else "N/A", table_cell_style),
            Paragraph(str(pk.nombre_colis), table_cell_style),
        ])
        
    col_widths = [100, 150, 110, 75, 45, 43]
    pickups_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]
    
    for i in range(1, len(table_data)):
        if i % 2 == 0:
            t_style.append(('BACKGROUND', (0, i), (-1, i), neutral_light))
            
    pickups_table.setStyle(TableStyle(t_style))
    story.append(pickups_table)
    story.append(Spacer(1, 12))
    
    # --- TOTAL SUMMARY BOX (Right Aligned, 2 Columns, No Text Wrapping) ---
    summary_data = [
        [Paragraph("TOTAL RAMASSAGES :", right_label_style), Paragraph(str(len(pickups)), right_value_style)],
        [Paragraph("TOTAL COLIS :", right_label_style), Paragraph(str(total_colis), right_value_style)]
    ]
    summary_table = Table(summary_data, colWidths=[150, 65], hAlign='RIGHT')
    summary_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FEF3C7")),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(summary_table)

    # Build document
    canvas_class = make_numbered_canvas(printed_by=printed_by, driver_nom=driver.nom if driver else None)
    doc.build(story, canvasmaker=canvas_class)
    
    buffer.seek(0)
    return buffer

# Async endpoint
@router.get(
    "/print",
    status_code=status.HTTP_200_OK,
    summary="Générer le bordereau PDF",
    description="Génère un fichier PDF récapitulatif des ramassages effectués par un chauffeur sur une période donnée avec les zones d'émargement."
)
async def print_pickup_slip(
    driver_id: int = Query(..., description="ID du chauffeur"),
    date_debut: date = Query(..., description="Date de début de la période"),
    date_fin: date = Query(..., description="Date de fin de la période"),
    preview: bool = Query(False, description="Afficher en ligne ou télécharger"),
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    # 1. Vérifier l'existence du chauffeur et charger sa relation agence
    result = await db.execute(
        select(Driver).where(Driver.id == driver_id).options(selectinload(Driver.agency))
    )
    driver = result.scalars().first()
    if not driver:
        raise NotFoundError("Chauffeur non trouvé.")
        
    # 2. Sécurité : Si l'utilisateur est manager/agent, vérifier que le chauffeur appartient à son agence
    if agence_id_filter is not None and driver.agence_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à accéder aux données de ce chauffeur.")

    # 3. Récupérer les ramassages du chauffeur sur la période
    pickup_query = (
        select(Pickup)
        .join(PickupSlip, Pickup.pickup_slip_id == PickupSlip.id)
        .where(PickupSlip.driver_id == driver_id)
        .where(Pickup.date >= date_debut)
        .where(Pickup.date <= date_fin)
        .order_by(Pickup.date, Pickup.heure)
    )
    pickup_result = await db.execute(pickup_query)
    pickups = pickup_result.scalars().all()

    # 4. Générer le PDF dans un thread séparé
    printed_by = current_user.nom if current_user else None
    buffer = await anyio.to_thread.run_sync(
        _generate_pdf_sync, pickups, driver, date_debut, date_fin, None, printed_by
    )
    
    filename = f"bordereau_{driver.nom.replace(' ', '_')}_{date_debut}_{date_fin}.pdf"
    disposition = "inline" if preview else "attachment"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"{disposition}; filename={filename}"
        }
    )

# --- NEW API ENDPOINTS FOR FRONTEND ---

class DriverSimple(BaseModel):
    id: int
    nom: str

class AgencySimple(BaseModel):
    id: int
    nom: str

class PickupSlipReadList(BaseModel):
    id: int
    numero_bordereau: str
    date_tournee: date
    heure_debut: time
    heure_fin: Optional[time] = None
    statut: str
    created_at: datetime
    driver: DriverSimple
    agency: AgencySimple
    colis_count: int
    pickups_count: int
    client_name: Optional[str] = None
    numero_declaration: Optional[str] = None

class PickupSlipListResponse(BaseModel):
    items: List[PickupSlipReadList]
    total: int
    total_ramassages: int
    total_colis: int
    en_attente: int
    livres: int

class PickupSlipReadDetailed(BaseModel):
    id: int
    numero_bordereau: str
    date_tournee: date
    heure_debut: time
    heure_fin: Optional[time] = None
    statut: str
    created_at: datetime
    driver: DriverSimple
    agency: AgencySimple
    pickups: List[PickupRead]

@router.get(
    "/drivers",
    response_model=List[DriverRead],
    status_code=status.HTTP_200_OK,
    summary="Obtenir la liste des chauffeurs actifs"
)
async def list_drivers(
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    query = select(Driver).where(Driver.actif == True).options(selectinload(Driver.agency))
    if agence_id_filter is not None:
        query = query.where(Driver.agence_id == agence_id_filter)
    result = await db.execute(query)
    return result.scalars().all()

@router.get(
    "/agences",
    response_model=List[AgencyRead],
    status_code=status.HTTP_200_OK,
    summary="Obtenir la liste des agences actives"
)
async def list_agencies(
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    query = select(Agency).where(Agency.actif == True)
    if agence_id_filter is not None:
        query = query.where(Agency.id == agence_id_filter)
    result = await db.execute(query)
    return result.scalars().all()

@router.get(
    "",
    response_model=PickupSlipListResponse,
    status_code=status.HTTP_200_OK,
    summary="Liste des bordereaux"
)
async def list_pickup_slips(
    driver_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    date_tournee: Optional[date] = Query(None),
    statut: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    query = select(PickupSlip).options(
        selectinload(PickupSlip.driver),
        selectinload(PickupSlip.agency),
        selectinload(PickupSlip.pickups)
    )
    
    # Enforce agency security filter
    if agence_id_filter is not None:
        query = query.where(PickupSlip.agency_id == agence_id_filter)
    elif agency_id is not None:
        query = query.where(PickupSlip.agency_id == agency_id)
        
    if driver_id is not None:
        query = query.where(PickupSlip.driver_id == driver_id)
    if date_tournee is not None:
        query = query.where(PickupSlip.date_tournee == date_tournee)
    if statut is not None:
        query = query.where(PickupSlip.statut == statut)
        
    query = query.order_by(PickupSlip.created_at.desc())
    
    # Calculate stats using efficient database aggregates
    from sqlalchemy import case
    stats_q = select(
        func.count(PickupSlip.id.distinct()),
        func.coalesce(func.sum(Pickup.nombre_colis), 0),
        func.count(Pickup.id),
        func.coalesce(func.sum(case((PickupSlip.statut.ilike("%attente%"), 1), else_=0)), 0),
        func.coalesce(func.sum(case(((PickupSlip.statut.ilike("%livr%")) | (PickupSlip.statut.ilike("%ferme%")), 1), else_=0)), 0)
    ).select_from(PickupSlip).outerjoin(Pickup, PickupSlip.id == Pickup.pickup_slip_id)
    
    # Apply identical filters to the stats query
    if agence_id_filter is not None:
        stats_q = stats_q.where(PickupSlip.agency_id == agence_id_filter)
    elif agency_id is not None:
        stats_q = stats_q.where(PickupSlip.agency_id == agency_id)
        
    if driver_id is not None:
        stats_q = stats_q.where(PickupSlip.driver_id == driver_id)
    if date_tournee is not None:
        stats_q = stats_q.where(PickupSlip.date_tournee == date_tournee)
    if statut is not None:
        stats_q = stats_q.where(PickupSlip.statut == statut)
        
    stats_result = await db.execute(stats_q)
    total, total_colis, total_ramassages, en_attente, livres = stats_result.first()
    
    # Apply pagination
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    slips = result.scalars().all()
    
    response = []
    for slip in slips:
        colis_count = sum(p.nombre_colis for p in slip.pickups)
        client_names = ", ".join(list(dict.fromkeys(p.client_nom for p in slip.pickups if p.client_nom)))
        declarations = ", ".join(list(dict.fromkeys(p.numero_declaration for p in slip.pickups if p.numero_declaration)))
        
        response.append({
            "id": slip.id,
            "numero_bordereau": slip.numero_bordereau,
            "date_tournee": slip.date_tournee,
            "heure_debut": slip.heure_debut,
            "heure_fin": slip.heure_fin,
            "statut": slip.statut,
            "created_at": slip.created_at,
            "driver": {"id": slip.driver.id, "nom": slip.driver.nom},
            "agency": {"id": slip.agency.id, "nom": slip.agency.nom, "ville": slip.agency.ville or slip.agency.nom},
            "colis_count": colis_count,
            "pickups_count": len(slip.pickups),
            "client_name": client_names or "-",
            "numero_declaration": declarations or "-"
        })
    return {
        "items": response,
        "total": total,
        "total_ramassages": total_ramassages,
        "total_colis": total_colis,
        "en_attente": en_attente,
        "livres": livres
    }

@router.post(
    "",
    response_model=PickupSlipRead,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un nouveau bordereau"
)
async def create_pickup_slip(
    slip_data: PickupSlipCreate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    # Enforce security filter
    if agence_id_filter is not None and slip_data.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à créer un bordereau pour cette agence.")
        
    # Generate unique number: BS-YYYYMMDD-XXX
    date_str = slip_data.date_tournee.strftime("%Y%m%d")
    prefix = f"BS-{date_str}-"
    
    # Get the maximum existing number suffix for today
    query_max = select(PickupSlip.numero_bordereau).where(
        PickupSlip.numero_bordereau.like(f"{prefix}%")
    ).order_by(PickupSlip.numero_bordereau.desc()).limit(1)
    
    res_max = await db.execute(query_max)
    last_code = res_max.scalar()
    
    if last_code:
        try:
            last_num = int(last_code.split("-")[-1])
            next_num = last_num + 1
        except Exception:
            next_num = 1
    else:
        next_num = 1
        
    numero_bordereau = f"{prefix}{next_num:03d}"
    
    new_slip = PickupSlip(
        numero_bordereau=numero_bordereau,
        driver_id=slip_data.driver_id,
        agency_id=slip_data.agency_id,
        date_tournee=slip_data.date_tournee,
        heure_debut=slip_data.heure_debut,
        statut="ouvert",
        created_by=current_user.id
    )
    
    db.add(new_slip)
    await db.flush()  # Obtain new_slip.id
    
    if slip_data.pickups:
        for p_data in slip_data.pickups:
            new_pickup = Pickup(
                pickup_slip_id=new_slip.id,
                numero_declaration=p_data.numero_declaration,
                client_nom=p_data.client_nom,
                client_telephone=p_data.client_telephone,
                adresse=p_data.adresse,
                ville=p_data.ville,
                nombre_colis=p_data.nombre_colis,
                date=p_data.date,
                heure=p_data.heure or datetime.now().time(),
                observations=p_data.observations
            )
            db.add(new_pickup)
            
    await db.commit()
    res = await db.execute(select(PickupSlip).where(PickupSlip.id == new_slip.id))
    return res.scalars().first()

@router.get(
    "/pickups/search",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Recherche multicritère de ramassages"
)
async def search_pickups(
    numero_declaration: Optional[str] = Query(None),
    client: Optional[str] = Query(None),
    ville: Optional[str] = Query(None),
    driver_id: Optional[int] = Query(None),
    agency_id: Optional[int] = Query(None),
    date_pick: Optional[date] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    query = select(Pickup).join(PickupSlip, Pickup.pickup_slip_id == PickupSlip.id).options(
        selectinload(Pickup.pickup_slip).selectinload(PickupSlip.driver),
        selectinload(Pickup.pickup_slip).selectinload(PickupSlip.agency)
    )
    
    # Enforce security filter
    if agence_id_filter is not None:
        query = query.where(PickupSlip.agency_id == agence_id_filter)
    elif agency_id is not None:
        query = query.where(PickupSlip.agency_id == agency_id)
        
    if numero_declaration:
        query = query.where(Pickup.numero_declaration.ilike(f"%{numero_declaration}%"))
    if client:
        query = query.where(Pickup.client_nom.ilike(f"%{client}%"))
    if ville:
        query = query.where(Pickup.ville.ilike(f"%{ville}%"))
    if driver_id is not None:
        query = query.where(PickupSlip.driver_id == driver_id)
    if date_pick is not None:
        query = query.where(Pickup.date == date_pick)
        
    # Count total query size
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar_one()
    
    # Apply pagination and sorting
    query = query.order_by(Pickup.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    pickups = result.scalars().all()
    
    items = []
    for p in pickups:
        items.append({
            "id": p.id,
            "pickup_slip_id": p.pickup_slip_id,
            "numero_declaration": p.numero_declaration,
            "client_nom": p.client_nom,
            "client_telephone": p.client_telephone,
            "adresse": p.adresse,
            "ville": p.ville,
            "nombre_colis": p.nombre_colis,
            "date": p.date,
            "heure": p.heure,
            "observations": p.observations,
            "driver_nom": p.pickup_slip.driver.nom,
            "agency_nom": p.pickup_slip.agency.nom
        })
        
    return {
        "items": items,
        "total": total
    }

@router.get(
    "/{slip_id}",
    response_model=PickupSlipReadDetailed,
    status_code=status.HTTP_200_OK,
    summary="Détails d'un bordereau"
)
async def get_pickup_slip(
    slip_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PickupSlip)
        .where(PickupSlip.id == slip_id)
        .options(
            selectinload(PickupSlip.driver),
            selectinload(PickupSlip.agency),
            selectinload(PickupSlip.pickups)
        )
    )
    slip = result.scalars().first()
    if not slip:
        raise NotFoundError("Bordereau non trouvé.")
        
    if agence_id_filter is not None and slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à accéder à ce bordereau.")
        
    return {
        "id": slip.id,
        "numero_bordereau": slip.numero_bordereau,
        "date_tournee": slip.date_tournee,
        "heure_debut": slip.heure_debut,
        "heure_fin": slip.heure_fin,
        "statut": slip.statut,
        "created_at": slip.created_at,
        "driver": {"id": slip.driver.id, "nom": slip.driver.nom},
        "agency": {"id": slip.agency.id, "nom": slip.agency.nom},
        "pickups": slip.pickups
    }

@router.get(
    "/{slip_id}/pdf",
    summary="Imprimer le PDF d'un bordereau spécifique"
)
async def get_pickup_slip_pdf(
    slip_id: int,
    preview: bool = Query(True),
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PickupSlip)
        .where(PickupSlip.id == slip_id)
        .options(
            selectinload(PickupSlip.driver).selectinload(Driver.agency),
            selectinload(PickupSlip.agency),
            selectinload(PickupSlip.pickups)
        )
    )
    slip = result.scalars().first()
    if not slip:
        raise NotFoundError("Bordereau non trouvé.")

    if agence_id_filter is not None and slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à accéder à ce bordereau.")

    printed_by = current_user.nom if current_user else None
    buffer = await anyio.to_thread.run_sync(
        _generate_pdf_sync, slip.pickups, slip.driver, slip.date_tournee, slip.date_tournee, slip.numero_bordereau, printed_by
    )

    filename = f"bordereau_{slip.numero_bordereau}.pdf"
    disposition = "inline" if preview else "attachment"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"{disposition}; filename={filename}"
        }
    )

@router.post(
    "/{slip_id}/pickups",
    response_model=PickupRead,
    status_code=status.HTTP_201_CREATED,
    summary="Ajouter un ramassage à un bordereau"
)
async def add_pickup_to_slip(
    slip_id: int,
    pickup_data: PickupCreate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    slip_result = await db.execute(
        select(PickupSlip).where(PickupSlip.id == slip_id)
    )
    slip = slip_result.scalars().first()
    if not slip:
        raise NotFoundError("Bordereau non trouvé.")
        
    if agence_id_filter is not None and slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à modifier ce bordereau.")
        
    if slip.statut == "clôturé":
        raise PermissionDeniedError("Le bordereau est clôturé. Impossible d'ajouter un ramassage.")
        
    new_pickup = Pickup(
        pickup_slip_id=slip_id,
        numero_declaration=pickup_data.numero_declaration,
        client_nom=pickup_data.client_nom,
        client_telephone=pickup_data.client_telephone,
        adresse=pickup_data.adresse,
        ville=pickup_data.ville,
        nombre_colis=pickup_data.nombre_colis,
        date=pickup_data.date,
        heure=pickup_data.heure,
        observations=pickup_data.observations
    )
    
    db.add(new_pickup)
    await db.commit()
    await db.refresh(new_pickup)
    return new_pickup

@router.post(
    "/{slip_id}/close",
    response_model=PickupSlipRead,
    status_code=status.HTTP_200_OK,
    summary="Clôturer un bordereau"
)
async def close_pickup_slip(
    slip_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PickupSlip).where(PickupSlip.id == slip_id)
    )
    slip = result.scalars().first()
    if not slip:
        raise NotFoundError("Bordereau non trouvé.")
        
    if agence_id_filter is not None and slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à modifier ce bordereau.")
        
    if slip.statut == "clôturé":
        return slip
        
    slip.statut = "clôturé"
    slip.heure_fin = datetime.now().time()
    await db.commit()
    await db.refresh(slip)
    return slip

@router.put(
    "/{slip_id}",
    response_model=dict,
    status_code=status.HTTP_200_OK,
    summary="Modifier un bordereau"
)
async def update_pickup_slip(
    slip_id: int,
    slip_data: PickupSlipUpdate,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PickupSlip).where(PickupSlip.id == slip_id)
    )
    slip = result.scalars().first()
    if not slip:
        raise NotFoundError("Bordereau non trouvé.")
        
    if agence_id_filter is not None and slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à modifier ce bordereau.")
        
    if slip_data.driver_id is not None:
        slip.driver_id = slip_data.driver_id
    if slip_data.agency_id is not None:
        slip.agency_id = slip_data.agency_id
    if slip_data.date_tournee is not None:
        slip.date_tournee = slip_data.date_tournee
    if slip_data.heure_debut is not None:
        slip.heure_debut = slip_data.heure_debut
    if slip_data.statut is not None:
        slip.statut = slip_data.statut
        
    await db.commit()
    return {"id": slip.id, "message": "Bordereau mis à jour avec succès"}

@router.delete(
    "/{slip_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un bordereau"
)
async def delete_pickup_slip(
    slip_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(PickupSlip).where(PickupSlip.id == slip_id)
    )
    slip = result.scalars().first()
    if not slip:
        raise NotFoundError("Bordereau non trouvé.")
        
    if agence_id_filter is not None and slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à supprimer ce bordereau.")
        
    await db.execute(delete(Pickup).where(Pickup.pickup_slip_id == slip_id))
    await db.delete(slip)
    await db.commit()
    return None

@router.delete(
    "/pickups/{pickup_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un ramassage individuel"
)
async def delete_pickup(
    pickup_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Pickup)
        .options(selectinload(Pickup.pickup_slip))
        .where(Pickup.id == pickup_id)
    )
    pickup = result.scalars().first()
    if not pickup:
        raise NotFoundError("Ramassage non trouvé.")

    if agence_id_filter is not None and pickup.pickup_slip and pickup.pickup_slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à supprimer ce ramassage.")

    await db.delete(pickup)
    await db.commit()
    return None

@router.delete(
    "/{slip_id}/pickups/{pickup_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Supprimer un ramassage d'un bordereau"
)
async def delete_pickup_from_slip(
    slip_id: int,
    pickup_id: int,
    current_user: User = Depends(RoleChecker(["super_admin", "manager", "agent"])),
    agence_id_filter: Optional[int] = Depends(get_user_agency_filter),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Pickup)
        .options(selectinload(Pickup.pickup_slip))
        .where(Pickup.id == pickup_id, Pickup.pickup_slip_id == slip_id)
    )
    pickup = result.scalars().first()
    if not pickup:
        raise NotFoundError("Ramassage non trouvé sur ce bordereau.")

    if agence_id_filter is not None and pickup.pickup_slip and pickup.pickup_slip.agency_id != agence_id_filter:
        raise PermissionDeniedError("Vous n'êtes pas autorisé à supprimer ce ramassage.")

    await db.delete(pickup)
    await db.commit()
    return None
