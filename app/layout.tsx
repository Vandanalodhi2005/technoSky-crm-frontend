
import "./globals.css";

export const metadata = {
  title: "Technosky CRM | Business Dashboard",
  description:
    "Technosky Solution customer relationship management dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
