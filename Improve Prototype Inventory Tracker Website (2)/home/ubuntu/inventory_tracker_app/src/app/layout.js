import './globals.css';

export const metadata = {
  title: 'Inventory Tracker',
  description: 'Advanced inventory management system for tracking liquor and storage inventory',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
