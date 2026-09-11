"use client";
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import styles from './SearchBar.module.css';

export const SearchBar = () => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Dispatch global search or navigate to search results
    console.log("Searching for:", query);
  };

  return (
    <form className={styles.wrapper} onSubmit={handleSearch}>
      <Search size={18} className={styles.icon} />
      <input
        type="text"
        className={styles.input}
        placeholder="Search emails..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </form>
  );
};
