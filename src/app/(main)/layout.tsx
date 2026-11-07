import Nav from '@/components/Nav';
import FloatingCalculator from '@/components/FloatingCalculator';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      {children}
      <FloatingCalculator />
    </>
  );
}
