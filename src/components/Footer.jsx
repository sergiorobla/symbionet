export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="text-center py-4 text-gray-400">
      thefacebook © {year}
    </footer>
  );
}
