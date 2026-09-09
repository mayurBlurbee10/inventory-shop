import AccessControlProvider from "@/components/Access/AccessControlProvider";
import Container from "@/components/Container";

export const metadata = {
  title: "MStrategy Portal",
  description: "A universal portal powered by MStrategy",
};

export default function RootLayout({ children }) {
  return (
    <AccessControlProvider>
      <Container>{children}</Container>
    </AccessControlProvider>
  );
}
