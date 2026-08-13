class HESException(Exception):
    """Exception de base pour l'application H.E.S."""
    def __init__(self, message: str):
        self.message = message
        super().__init__(message)

class AuthenticationError(HESException):
    """Exception levée en cas d'échec d'authentification."""
    pass

class PermissionDeniedError(HESException):
    """Exception levée en cas de droits insuffisants."""
    pass

class NotFoundError(HESException):
    """Exception levée lorsqu'une ressource n'est pas trouvée."""
    pass

class ValidationError(HESException):
    """Exception levée en cas de données invalides."""
    pass

class ConflictError(HESException):
    """Exception levée en cas de conflit de données (ex: email déjà utilisé)."""
    pass
