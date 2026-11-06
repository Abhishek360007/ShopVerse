import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Footer = () => {
  const categories = useSelector((state) => state?.categoryState?.categories) ?? [];

  return (
    <footer className="mt-16 border-t border-line">
      <div className="shell flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-base font-bold">ShopVerse</p>
        <p className="text-sm text-muted">Your everything store — electronics, fashion, home, books, sports &amp; beauty.</p>
        {categories.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm text-muted">
            {categories.map((category) => (
              <li key={category.id}>
                <Link to={`/category/${category.code}`} className="hover:text-fg">{category.name}</Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm text-muted">© {new Date().getFullYear()} ShopVerse. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
