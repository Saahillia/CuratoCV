import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      'react': path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(import.meta.dirname, 'node_modules/react-router-dom'),
      'lucide-react': path.resolve(import.meta.dirname, 'node_modules/lucide-react'),
      'react-redux': path.resolve(import.meta.dirname, 'node_modules/react-redux'),
      '@reduxjs/toolkit': path.resolve(import.meta.dirname, 'node_modules/@reduxjs/toolkit'),
      'react-hot-toast': path.resolve(import.meta.dirname, 'node_modules/react-hot-toast'),
      'axios': path.resolve(import.meta.dirname, 'node_modules/axios')
    }
  }
})
