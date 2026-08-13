'use client';

import React from "react";
import AuthenticatedLayout from "../../components/AuthenticatedLayout";

export default function ImpressionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedLayout>
      {children}
    </AuthenticatedLayout>
  );
}
