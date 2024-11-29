interface ReportWrapperProps {
  children: React.ReactNode;
}

export function ReportWrapper({ children }: ReportWrapperProps) {
  return (
    <div className="min-w-[75vw] space-y-6">
      {children}
    </div>
  );
} 