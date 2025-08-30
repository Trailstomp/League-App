import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import "./App.css";

// Custom Icon Library - SVG-based icons to replace lucide-react
const IconLibrary = {
  Home: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  ),
  BarChart2: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  Users: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="m22 21-2-2m2 2-2-2m2 2-2-2"/>
      <path d="M16 11h6"/>
    </svg>
  ),
  Calendar: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Shield: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Menu: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="6" x2="20" y2="6"/>
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="18" x2="20" y2="18"/>
    </svg>
  ),
  X: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Briefcase: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  Settings: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3"/>
      <path d="m12 1 2.12 2.12L17.94 1H23v5.06l-2.12 2.82L23 11v2l-2.12 2.82L23 18.94V24h-5.06l-2.82-2.12L12 24l-2.12-2.12L7.06 24H1v-5.06l2.12-2.82L1 13v-2l2.12-2.82L1 5.06V0h5.06l2.82 2.12L12 1z"/>
    </svg>
  ),
  LogOut: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16,17 21,12 16,7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Sun: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  ArrowUp: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="19" x2="12" y2="5"/>
      <polyline points="5,12 12,5 19,12"/>
    </svg>
  ),
  ArrowDown: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <polyline points="19,12 12,19 5,12"/>
    </svg>
  ),
  Trophy: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <path d="m5 7 1 12h12l1-12"/>
      <path d="M6 7h12l-1-4H7l-1 4z"/>
    </svg>
  ),
  Swords: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="14.5,17.5 3,6 3,3 6,3 17.5,14.5"/>
      <line x1="13" y1="19" x2="19" y2="13"/>
      <line x1="16" y1="16" x2="20" y2="20"/>
      <line x1="19" y1="21" x2="21" y2="19"/>
    </svg>
  ),
  MessageSquare: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Crown: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
    </svg>
  ),
  LogIn: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10,17 15,12 10,7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  ),
  Mail: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-10 5L2 7"/>
    </svg>
  ),
  Edit: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  ToggleLeft: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
      <circle cx="8" cy="12" r="3"/>
    </svg>
  ),
  ToggleRight: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="5" width="22" height="14" rx="7" ry="7"/>
      <circle cx="16" cy="12" r="3"/>
    </svg>
  ),
  Plus: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash2: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="3,6 5,6 21,6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  Twitter: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
    </svg>
  ),
  Instagram: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  ),
  Facebook: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  ),
  ImageIcon: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="9" cy="9" r="2"/>
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
  Video: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="23,7 16,12 23,17 23,7"/>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
    </svg>
  ),
  UserCheck: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <polyline points="17,11 19,13 23,9"/>
    </svg>
  ),
  UserX: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="18" y1="8" x2="23" y2="13"/>
      <line x1="23" y1="8" x2="18" y2="13"/>
    </svg>
  ),
  UserPlus: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="8.5" cy="7" r="4"/>
      <line x1="20" y1="8" x2="20" y2="14"/>
      <line x1="23" y1="11" x2="17" y2="11"/>
    </svg>
  ),
  Palette: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="13.5" cy="6.5" r=".5"/>
      <circle cx="17.5" cy="10.5" r=".5"/>
      <circle cx="8.5" cy="7.5" r=".5"/>
      <circle cx="6.5" cy="12.5" r=".5"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
    </svg>
  ),
  MapPin: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  ChevronLeft: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="15,18 9,12 15,6"/>
    </svg>
  ),
  ChevronRight: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="9,18 15,12 9,6"/>
    </svg>
  ),
  Eye: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Upload: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17,8 12,3 7,8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  ),
  Play: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="5,3 19,12 5,21 5,3"/>
    </svg>
  ),
  Pause: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="6" y="4" width="4" height="16"/>
      <rect x="14" y="4" width="4" height="16"/>
    </svg>
  ),
  Music: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  Layout: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/>
      <line x1="9" y1="21" x2="9" y2="9"/>
    </svg>
  ),
  Zap: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
    </svg>
  ),
  Type: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="4,7 4,4 20,4 20,7"/>
      <line x1="9" y1="20" x2="15" y2="20"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
    </svg>
  ),
  Star: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
    </svg>
  ),
  Share2: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  Globe: ({ size = 20, color = "currentColor", ...props }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  )
};

// Component wrapper for easy icon usage
const Icon = ({ name, ...props }) => {
  const IconComponent = IconLibrary[name];
  return IconComponent ? <IconComponent {...props} /> : null;
};

// Enhanced Image Component with Fit Options
const EnhancedImage = ({ 
    src, 
    alt, 
    className = '', 
    fit = 'cover', // cover, contain, fill, scale-down, none
    aspectRatio = null, // e.g., '16/9', '1/1', '4/3'
    fallback = null,
    showFitControls = false,
    onFitChange = null,
    ...props 
}) => {
    const [currentFit, setCurrentFit] = useState(fit);
    const [imageError, setImageError] = useState(false);
    
    const fitOptions = [
        { value: 'cover', label: 'Cover (Crop)', icon: '📐' },
        { value: 'contain', label: 'Contain (Fit)', icon: '📦' },
        { value: 'fill', label: 'Fill (Stretch)', icon: '↔️' },
        { value: 'scale-down', label: 'Scale Down', icon: '⬇️' },
        { value: 'none', label: 'Original', icon: '🖼️' }
    ];
    
    const handleFitChange = (newFit) => {
        setCurrentFit(newFit);
        if (onFitChange) onFitChange(newFit);
    };
    
    const imageStyle = {
        objectFit: currentFit,
        ...(aspectRatio && { aspectRatio: aspectRatio }),
        ...props.style
    };
    
    const imageSrc = imageError ? 
        (fallback || `https://ui-avatars.com/api/?name=${alt?.replace(' ', '+')}&background=random&size=400`) : 
        src;
    
    return (
        <div className={`relative ${className}`} {...props}>
            <img
                src={imageSrc}
                alt={alt}
                style={imageStyle}
                className="w-full h-full transition-all duration-300"
                onError={() => setImageError(true)}
                onLoad={() => setImageError(false)}
            />
            
            {/* Fit Controls Overlay */}
            {showFitControls && (
                <div className="absolute top-2 right-2 z-10">
                    <div className="bg-black bg-opacity-75 rounded-lg p-2">
                        <div className="flex flex-wrap gap-1">
                            {fitOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleFitChange(option.value)}
                                    className={`px-2 py-1 text-xs rounded transition-colors ${
                                        currentFit === option.value
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-600 text-gray-200 hover:bg-gray-500'
                                    }`}
                                    title={option.label}
                                >
                                    {option.icon}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// RSVP Management Component
const RSVPManager = ({ event, currentUser, onUpdateRSVP, users, showFullList = false }) => {
    const [showResponses, setShowResponses] = useState(false);
    
    if (!event?.rsvp?.enabled) return null;
    
    const responses = event.rsvp.responses || [];
    const userResponse = responses.find(r => r.userId === currentUser?.id);
    const yesCount = responses.filter(r => r.status === 'yes').length;
    const noCount = responses.filter(r => r.status === 'no').length;
    const maybeCount = responses.filter(r => r.status === 'maybe').length;
    
    const handleRSVP = (status) => {
        if (!currentUser) return;
        
        const newResponse = {
            userId: currentUser.id,
            userName: currentUser.name,
            status: status,
            timestamp: new Date().toISOString()
        };
        
        const updatedResponses = responses.filter(r => r.userId !== currentUser.id);
        updatedResponses.push(newResponse);
        
        onUpdateRSVP(event.id, updatedResponses);
    };
    
    return (
        <div className="bg-slate-50 rounded-lg p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-800 flex items-center">
                    <UserCheck className="mr-2" size={16} />
                    Event RSVP
                </h4>
                <button 
                    onClick={() => setShowResponses(!showResponses)}
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                >
                    <span className="mr-1">View Responses</span>
                    {showResponses ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                </button>
            </div>
            
            {/* RSVP Buttons */}
            <div className="flex space-x-2 mb-3">
                <button 
                    onClick={() => handleRSVP('yes')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        userResponse?.status === 'yes' 
                            ? 'bg-green-600 text-white' 
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                    }`}
                >
                    ✓ Yes ({yesCount})
                </button>
                <button 
                    onClick={() => handleRSVP('maybe')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        userResponse?.status === 'maybe' 
                            ? 'bg-yellow-600 text-white' 
                            : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    }`}
                >
                    ? Maybe ({maybeCount})
                </button>
                <button 
                    onClick={() => handleRSVP('no')}
                    className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                        userResponse?.status === 'no' 
                            ? 'bg-red-600 text-white' 
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                    }`}
                >
                    ✗ No ({noCount})
                </button>
            </div>
            
            {/* Response Summary */}
            <div className="text-sm text-slate-600 mb-3">
                {responses.length > 0 ? (
                    <span>
                        {responses.length} total response{responses.length !== 1 ? 's' : ''} • 
                        <span className="text-green-600 font-medium"> {yesCount} attending</span>
                        {maybeCount > 0 && <span className="text-yellow-600"> • {maybeCount} maybe</span>}
                        {noCount > 0 && <span className="text-red-600"> • {noCount} not attending</span>}
                    </span>
                ) : (
                    <span>No responses yet</span>
                )}
            </div>
            
            {/* Detailed Response List */}
            {showResponses && responses.length > 0 && (
                <div className="border-t pt-3 mt-3">
                    <div className="space-y-2">
                        {['yes', 'maybe', 'no'].map(status => {
                            const statusResponses = responses.filter(r => r.status === status);
                            if (statusResponses.length === 0) return null;
                            
                            const statusConfig = {
                                yes: { label: 'Attending', color: 'text-green-600', icon: '✓' },
                                maybe: { label: 'Maybe', color: 'text-yellow-600', icon: '?' },
                                no: { label: 'Not Attending', color: 'text-red-600', icon: '✗' }
                            };
                            
                            const config = statusConfig[status];
                            
                            return (
                                <div key={status} className="mb-2">
                                    <h5 className={`text-sm font-semibold ${config.color} mb-1`}>
                                        {config.icon} {config.label} ({statusResponses.length})
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm">
                                        {statusResponses
                                            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                                            .map(response => (
                                            <div key={`${response.userId}-${status}`} className="flex items-center text-slate-700">
                                                <span className="font-medium">{response.userName}</span>
                                                <span className="ml-auto text-xs text-slate-500">
                                                    {new Date(response.timestamp).toLocaleDateString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {userResponse && (
                <div className="text-xs text-slate-500 mt-2">
                    Your response: <span className="font-medium">{userResponse.status}</span> • 
                    Submitted {new Date(userResponse.timestamp).toLocaleDateString()}
                </div>
            )}
        </div>
    );
};

// Event Management Dashboard
const EventDashboard = ({ teams, currentUser, onSendNotification, websiteStyle }) => {
    const [selectedTeamFilter, setSelectedTeamFilter] = useState('all');
    const [viewMode, setViewMode] = useState('upcoming'); // 'upcoming', 'past', 'all'
    
    // Get all events with RSVP enabled
    const allRSVPEvents = teams.flatMap(team => 
        (team.calendar || [])
            .filter(event => event.rsvp?.enabled)
            .map(event => ({
                ...event,
                teamName: team.name,
                teamId: team.id,
                teamLogo: team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'
            }))
    );
    
    // Filter events
    const filteredEvents = allRSVPEvents.filter(event => {
        const teamMatch = selectedTeamFilter === 'all' || event.teamId === selectedTeamFilter;
        const now = new Date();
        const eventDate = new Date(event.date);
        
        let dateMatch = true;
        if (viewMode === 'upcoming') {
            dateMatch = eventDate >= now;
        } else if (viewMode === 'past') {
            dateMatch = eventDate < now;
        }
        
        return teamMatch && dateMatch;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Calculate statistics
    const getEventStats = (event) => {
        const responses = event.rsvp?.responses || [];
        return {
            total: responses.length,
            yes: responses.filter(r => r.status === 'yes').length,
            maybe: responses.filter(r => r.status === 'maybe').length,
            no: responses.filter(r => r.status === 'no').length,
            attendanceRate: responses.length > 0 ? (responses.filter(r => r.status === 'yes').length / responses.length * 100).toFixed(1) : 0
        };
    };
    
    const overallStats = {
        totalEvents: filteredEvents.length,
        eventsWithResponses: filteredEvents.filter(e => (e.rsvp?.responses || []).length > 0).length,
        averageAttendance: filteredEvents.length > 0 ? (
            filteredEvents.reduce((sum, event) => sum + parseFloat(getEventStats(event).attendanceRate), 0) / filteredEvents.length
        ).toFixed(1) : 0
    };
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">Event Management Dashboard</h1>
                <button 
                    onClick={() => window.history.back()}
                    className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center text-sm"
                >
                    ← Back to Events
                </button>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Team</label>
                        <select 
                            value={selectedTeamFilter} 
                            onChange={(e) => setSelectedTeamFilter(e.target.value)}
                            className="p-2 border border-slate-300 rounded-md"
                        >
                            <option value="all">All Teams</option>
                            {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Time Period</label>
                        <select 
                            value={viewMode} 
                            onChange={(e) => setViewMode(e.target.value)}
                            className="p-2 border border-slate-300 rounded-md"
                        >
                            <option value="upcoming">Upcoming Events</option>
                            <option value="past">Past Events</option>
                            <option value="all">All Events</option>
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Overall Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-600 text-sm font-medium">Total Events</p>
                            <p className="text-3xl font-bold text-blue-900">{overallStats.totalEvents}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-500" />
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-600 text-sm font-medium">Events w/ Responses</p>
                            <p className="text-3xl font-bold text-green-900">{overallStats.eventsWithResponses}</p>
                        </div>
                        <UserCheck className="h-8 w-8 text-green-500" />
                    </div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-600 text-sm font-medium">Avg. Attendance Rate</p>
                            <p className="text-3xl font-bold text-yellow-900">{overallStats.averageAttendance}%</p>
                        </div>
                        <BarChart2 className="h-8 w-8 text-yellow-500" />
                    </div>
                </div>
            </div>
            
            {/* Event List with Details */}
            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Event Details & Actions</h2>
                
                {filteredEvents.length > 0 ? filteredEvents.map(event => {
                    const stats = getEventStats(event);
                    const isUpcoming = new Date(event.date) >= new Date();
                    
                    return (
                        <div key={`${event.teamId}-${event.id}`} className="bg-white rounded-lg p-6 shadow-sm border">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2 mb-2">
                                        <img src={event.teamLogo} alt={event.teamName} className="w-6 h-6 rounded-full object-contain" />
                                        <span className="font-semibold text-slate-600">{event.teamName}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            event.type === 'game' ? 'bg-red-100 text-red-800' :
                                            event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>
                                            {event.type}
                                        </span>
                                        {!isUpcoming && <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-600">Past</span>}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800 mb-1">{event.title}</h3>
                                    <div className="text-sm text-slate-600 mb-3">
                                        {new Date(event.date).toLocaleDateString('en-US', { 
                                            weekday: 'long', 
                                            month: 'long', 
                                            day: 'numeric', 
                                            year: 'numeric',
                                            timeZone: 'UTC' 
                                        })} at {event.time}
                                        {event.location && <span> • {event.location}</span>}
                                    </div>
                                </div>
                            </div>
                            
                            {/* RSVP Statistics */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                                <div className="text-center p-3 bg-slate-50 rounded">
                                    <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
                                    <div className="text-xs text-slate-600">Total Responses</div>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded">
                                    <div className="text-2xl font-bold text-green-700">{stats.yes}</div>
                                    <div className="text-xs text-green-600">Attending</div>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded">
                                    <div className="text-2xl font-bold text-yellow-700">{stats.maybe}</div>
                                    <div className="text-xs text-yellow-600">Maybe</div>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded">
                                    <div className="text-2xl font-bold text-red-700">{stats.no}</div>
                                    <div className="text-xs text-red-600">Not Attending</div>
                                </div>
                                <div className="text-center p-3 bg-blue-50 rounded">
                                    <div className="text-2xl font-bold text-blue-700">{stats.attendanceRate}%</div>
                                    <div className="text-xs text-blue-600">Attendance Rate</div>
                                </div>
                            </div>
                            
                            {/* Action Buttons */}
                            {isUpcoming && (hasPermission(currentUser, 'events.edit') || event.teamId === currentUser?.teamId) && (
                                <div className="flex space-x-3 pt-4 border-t">
                                    <button 
                                        onClick={() => onSendNotification(event, 'reminder')}
                                        className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        <Mail size={16} />
                                        <span>Send Reminder</span>
                                    </button>
                                    <button 
                                        onClick={() => onSendNotification(event, 'rsvp_request')}
                                        className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors"
                                    >
                                        <MessageSquare size={16} />
                                        <span>Request RSVP</span>
                                    </button>
                                    <button 
                                        onClick={() => onSendNotification(event, 'last_call')}
                                        className="flex items-center space-x-2 bg-orange-100 text-orange-700 px-4 py-2 rounded hover:bg-orange-200 transition-colors"
                                    >
                                        <Zap size={16} />
                                        <span>Last Call</span>
                                    </button>
                                </div>
                            )}
                            
                            {/* Notification History */}
                            {event.rsvp?.remindersSent && event.rsvp.remindersSent.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Notification History</h5>
                                    <div className="space-y-1">
                                        {event.rsvp.remindersSent.slice(-3).map((reminder, index) => (
                                            <div key={index} className="text-xs text-slate-500">
                                                {reminder.type} sent {new Date(reminder.sentAt).toLocaleDateString()} to {reminder.recipients.length} recipients
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div className="text-center py-12 text-slate-500">
                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <p>No events with RSVP found for the selected filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Export individual icons for backward compatibility
const Home = (props) => <Icon name="Home" {...props} />;
const BarChart2 = (props) => <Icon name="BarChart2" {...props} />;
const Users = (props) => <Icon name="Users" {...props} />;
const Calendar = (props) => <Icon name="Calendar" {...props} />;
const Shield = (props) => <Icon name="Shield" {...props} />;
const Menu = (props) => <Icon name="Menu" {...props} />;
const X = (props) => <Icon name="X" {...props} />;
const Settings = (props) => <Icon name="Settings" {...props} />;
const LogOut = (props) => <Icon name="LogOut" {...props} />;
const Sun = (props) => <Icon name="Sun" {...props} />;
const Moon = (props) => <Icon name="Moon" {...props} />;
const ArrowUp = (props) => <Icon name="ArrowUp" {...props} />;
const ArrowDown = (props) => <Icon name="ArrowDown" {...props} />;
const Trophy = (props) => <Icon name="Trophy" {...props} />;
const Swords = (props) => <Icon name="Swords" {...props} />;
const MessageSquare = (props) => <Icon name="MessageSquare" {...props} />;
const Crown = (props) => <Icon name="Crown" {...props} />;
const LogIn = (props) => <Icon name="LogIn" {...props} />;
const Mail = (props) => <Icon name="Mail" {...props} />;
const Edit = (props) => <Icon name="Edit" {...props} />;
const ToggleLeft = (props) => <Icon name="ToggleLeft" {...props} />;
const ToggleRight = (props) => <Icon name="ToggleRight" {...props} />;
const Plus = (props) => <Icon name="Plus" {...props} />;
const Trash2 = (props) => <Icon name="Trash2" {...props} />;
const Twitter = (props) => <Icon name="Twitter" {...props} />;
const Instagram = (props) => <Icon name="Instagram" {...props} />;
const Facebook = (props) => <Icon name="Facebook" {...props} />;
const ImageIcon = (props) => <Icon name="ImageIcon" {...props} />;
const Video = (props) => <Icon name="Video" {...props} />;
const UserCheck = (props) => <Icon name="UserCheck" {...props} />;
const UserX = (props) => <Icon name="UserX" {...props} />;
const UserPlus = (props) => <Icon name="UserPlus" {...props} />;
const MapPin = (props) => <Icon name="MapPin" {...props} />;
const Palette = (props) => <Icon name="Palette" {...props} />;
const ChevronLeft = (props) => <Icon name="ChevronLeft" {...props} />;
const ChevronRight = (props) => <Icon name="ChevronRight" {...props} />;
const Eye = (props) => <Icon name="Eye" {...props} />;
const Upload = (props) => <Icon name="Upload" {...props} />;
const Play = (props) => <Icon name="Play" {...props} />;
const Pause = (props) => <Icon name="Pause" {...props} />;
const Music = (props) => <Icon name="Music" {...props} />;
const Layout = (props) => <Icon name="Layout" {...props} />;
const Zap = (props) => <Icon name="Zap" {...props} />;
const Type = (props) => <Icon name="Type" {...props} />;
const Star = (props) => <Icon name="Star" {...props} />;
const Share2 = (props) => <Icon name="Share2" {...props} />;
const Globe = (props) => <Icon name="Globe" {...props} />;
const Briefcase = (props) => <Icon name="Briefcase" {...props} />;

// --- ASSETS ---
const MlblLogo = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzE4MTgyOCIvPjxwYXRoIGQ9Ik0zMCAyMEw3MCAyMFY4MEw1MCA5MEwzMCA4MFoiIGZpbGw9IiNkYzI2MjYiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIzMCIgZm9udC1mYW1pbHk9InNlcmlmIiBmaWxsPSJ3aGl0ZSI+TUxCTDwvdGV4dD48L3N2Zz4=";

// Music Player Component
const MusicPlayer = ({ musicState, setMusicState }) => {
    const audioRef = useRef(null);

    useEffect(() => {
        if (audioRef.current) {
            setMusicState(prev => ({ ...prev, audioRef: audioRef.current }));
        }
    }, [setMusicState]);

    useEffect(() => {
        if (audioRef.current && musicState.currentTrack) {
            audioRef.current.src = musicState.currentTrack.url;
            if (musicState.isPlaying) {
                audioRef.current.play().catch(console.error);
            }
        }
    }, [musicState.currentTrack, musicState.isPlaying]);

    const togglePlay = () => {
        if (audioRef.current) {
            if (musicState.isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play().catch(console.error);
            }
            setMusicState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
        }
    };

    const stopMusic = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setMusicState(prev => ({ ...prev, isPlaying: false, currentTrack: null }));
        }
    };

    if (!musicState.currentTrack) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 z-50 max-w-xs">
            <div className="flex items-center space-x-3">
                <div className="flex-grow">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                        {musicState.currentTrack.title}
                    </p>
                    {musicState.currentTrack.teamId && (
                        <p className="text-xs text-slate-500">Team Music</p>
                    )}
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={togglePlay}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
                    >
                        {musicState.isPlaying ? <X size={16} /> : <Play size={16} />}
                    </button>
                    <button
                        onClick={stopMusic}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
            <audio
                ref={audioRef}
                onEnded={() => setMusicState(prev => ({ ...prev, isPlaying: false }))}
                onPlay={() => setMusicState(prev => ({ ...prev, isPlaying: true }))}
                onPause={() => setMusicState(prev => ({ ...prev, isPlaying: false }))}
            />
        </div>
    );
};
const getLogoStyle = (websiteStyle) => {
    const logoStyle = websiteStyle?.logoStyle || 'contain';
    return logoStyle === 'contain' ? 'object-contain' : 
           logoStyle === 'cover' ? 'object-cover' : 
           'object-fill';
};

// File Upload Component
const FileUploadInput = ({ 
    label, 
    accept, 
    currentValue, 
    onChange, 
    placeholder, 
    enableCrop = false, 
    cropAspectRatio = 'free', 
    cropContext = 'header',
    showAspectRatioPresets = false,
    allowCustomAspectRatio = false 
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showCropTool, setShowCropTool] = useState(false);
    const [originalImageUrl, setOriginalImageUrl] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (file) {
            setIsUploading(true);
            
            // Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            
            // If it's an image and crop is enabled, show crop tool
            if (accept.includes('image') && enableCrop) {
                setOriginalImageUrl(objectUrl);
                setShowCropTool(true);
                setIsUploading(false);
            } else {
                onChange(objectUrl);
                setIsUploading(false);
            }
        }
    };

    const handleCrop = (croppedImageData) => {
        console.log('🎯 FileInput handleCrop called with data:', croppedImageData ? 'data received' : 'no data');
        
        // Ensure we have valid data before proceeding
        if (!croppedImageData) {
            console.error('❌ No cropped image data received');
            return;
        }

        try {
            // Call onChange with cropped data - this should preserve form state
            console.log('🔄 Calling onChange with cropped image data...');
            onChange(croppedImageData);
            console.log('✅ Image data updated successfully');
            
            // Close crop tool
            setShowCropTool(false);
            
            // Clean up original image URL if it was a blob
            if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(originalImageUrl);
                console.log('🧹 Cleaned up original blob URL');
            }
            setOriginalImageUrl(null);
            
        } catch (error) {
            console.error('❌ Error in handleCrop:', error);
        }
    };

    const handleCropCancel = () => {
        setShowCropTool(false);
        
        // Clean up original image URL if it was a blob
        if (originalImageUrl && originalImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(originalImageUrl);
        }
        setOriginalImageUrl(null);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const openCropTool = () => {
        if (currentValue && accept.includes('image')) {
            setOriginalImageUrl(currentValue);
            setShowCropTool(true);
        }
    };

    return (
        <div className="space-y-2">
            <label className="block font-semibold text-slate-700">{label}</label>
            
            {/* Drop Zone */}
            <div 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-slate-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={accept}
                    onChange={(e) => {
                        const file = e.target.files[0];
                        handleFileSelect(file);
                    }}
                    className="hidden"
                />
                
                {isUploading ? (
                    <div className="py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-sm text-blue-600">Processing image...</p>
                    </div>
                ) : currentValue ? (
                    <div className="space-y-2">
                        {accept.includes('image') ? (
                            <div className="relative inline-block">
                                <img 
                                    src={currentValue} 
                                    alt="Preview" 
                                    className="max-w-full max-h-32 mx-auto rounded object-contain"
                                    style={{ maxHeight: '128px' }}
                                    onError={(e) => {
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y3ZjdmNyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5Ij5JbWFnZSBub3QgZm91bmQ8L3RleHQ+PC9zdmc+';
                                    }}
                                />
                                {/* Edit Image Button */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setOriginalImageUrl(currentValue);
                                        setShowCropTool(true);
                                    }}
                                    className="absolute top-1 right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg transition-colors"
                                    title="Edit image"
                                >
                                    <Settings size={12} />
                                </button>
                            </div>
                        ) : accept.includes('video') ? (
                            <div className="bg-slate-200 h-32 flex items-center justify-center rounded">
                                <span className="text-slate-600">Video selected</span>
                            </div>
                        ) : null}
                        <p className="text-sm text-green-600">✅ File selected - Click to change</p>
                        
                        {/* Crop Tool Button */}
                        {enableCrop && accept.includes('image') && currentValue && (
                            <div className="mt-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openCropTool(); }}
                                    className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md text-sm transition-colors"
                                >
                                    <Edit size={14} />
                                    <span>Crop & Adjust</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-4">
                        <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-600">{placeholder || 'Click or drag to upload file'}</p>
                        <p className="text-xs text-slate-500 mt-1">Supported: {accept}</p>
                        {enableCrop && accept.includes('image') && (
                            <p className="text-xs text-blue-600 mt-1">✨ Includes crop & resize tool</p>
                        )}
                    </div>
                )}
            </div>
            
            {/* URL Input as Fallback */}
            <div className="text-xs">
                <label className="text-slate-500">Or paste URL:</label>
                <input 
                    type="url"
                    value={typeof currentValue === 'string' && currentValue.startsWith('http') ? currentValue : ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-1 border rounded text-xs mt-1"
                />
            </div>

            {/* Crop Tool Modal */}
            {showCropTool && originalImageUrl && (
                <ImageCropTool
                    imageUrl={originalImageUrl}
                    onCrop={handleCrop}
                    onCancel={handleCropCancel}
                    aspectRatio={cropAspectRatio}
                />
            )}


        </div>
    );
};

// Helper function to find address from location name
const findLocationAddress = (locationName, teams) => {
    if (!locationName || !teams) return null;
    
    for (const team of teams) {
        if (team.locations) {
            const location = team.locations.find(loc => loc.name === locationName);
            if (location) {
                return location.address;
            }
        }
    }
    return null;
};

// Background style utility function
const getBackgroundStyle = (websiteStyle) => {
    const style = {};
    
    // Page background color
    if (websiteStyle?.pageBackgroundColor) {
        style.backgroundColor = websiteStyle.pageBackgroundColor;
    }
    
    // Background image overlay
    if (websiteStyle?.backgroundImage) {
        const { backgroundImage, backgroundMode = 'cover', backgroundOpacity = 0.1 } = websiteStyle;
        
        let backgroundSize = 'cover';
        let backgroundRepeat = 'no-repeat';
        
        switch (backgroundMode) {
            case 'contain':
                backgroundSize = 'contain';
                break;
            case 'repeat':
                backgroundSize = 'auto';
                backgroundRepeat = 'repeat';
                break;
            default: // 'cover'
                backgroundSize = 'cover';
                break;
        }
        
        style.backgroundImage = `linear-gradient(rgba(255, 255, 255, ${1 - backgroundOpacity}), rgba(255, 255, 255, ${1 - backgroundOpacity})), url(${backgroundImage})`;
        style.backgroundSize = backgroundSize;
        style.backgroundRepeat = backgroundRepeat;
        style.backgroundPosition = 'center';
        style.backgroundAttachment = 'fixed';
    }
    
    return style;
};

// Clickable location component
const ClickableLocation = ({ locationName, teams, className = "", children }) => {
    const address = findLocationAddress(locationName, teams);
    
    const handleClick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const searchTerm = address || locationName;
        const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchTerm)}&t=k`;
        window.open(mapsUrl, '_blank');
    };
    
    if (!locationName) return null;
    
    return (
        <button 
            onClick={handleClick}
            className={`text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors ${className}`}
            title={`Click to open in Google Maps${address ? ` (${address})` : ''}`}
        >
            {children || locationName}
        </button>
    );
};

// --- DATA IMPORTED FROM SPREADSHEETS ---
const initialMockUsers = [
    { id: 1, name: 'Admin Ali', roleIds: ['super_admin'], teamId: null, email: 'admin@mlbl.org', roles: ['admin'], status: 'active', createdAt: '2024-01-01' },
    { id: 2, name: 'Coach Chandler (OH10)', roleIds: ['team_coach'], teamId: 'oh10-lacrosse', email: 'cschrudder23@gmail.com', roles: ['coach'], status: 'active', createdAt: '2024-01-15' },
    { id: 3, name: 'Player Pat (Dayton)', roleIds: ['player'], teamId: 'dayton-eagles', email: 'pat@test.com', roles: ['player'], status: 'active', createdAt: '2024-02-01' },
    { id: 4, name: 'Coach Dave (Dads)', roleIds: ['team_coach'], teamId: 'american-dads', email: 'dave@test.com', roles: ['coach'], status: 'active', createdAt: '2024-02-15' },
    // Pending users (for testing)
    { id: 5, name: 'New Player John', roleIds: [], teamId: 'indiana-lacers', email: 'john.new@test.com', roles: [], status: 'pending', createdAt: '2025-06-15', preferredRole: 'player', phone: '555-1234', reasonForJoining: 'Want to join the league and play competitive lacrosse' },
    { id: 6, name: 'Sarah Coach', roleIds: [], teamId: 'columbus-ball-hawgs', email: 'sarah.coach@test.com', roles: [], status: 'pending', createdAt: '2025-06-20', preferredRole: 'coach', phone: '555-5678', reasonForJoining: 'Experienced player looking to coach and help develop the team' },
];

const initialTeams = [
    { id: 'oh10-lacrosse', name: 'OH10 Lacrosse', logo: 'https://lh3.googleusercontent.com/d/12Piww7Y46hHbAbnDZwxsFDBfuSKbq2RR', wins: 4, losses: 2, ties: 0, pf: 65, pa: 59, contactEmail: 'cschrudder23@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [
        { 
            id: 'oh10-practice-1', 
            title: 'Weekly Practice', 
            date: '2025-01-15', 
            time: '18:00', 
            type: 'practice', 
            location: 'Local Field', 
            description: 'Regular team practice session',
            rsvp: {
                enabled: true,
                responses: [
                    { userId: 1, userName: 'Chandler Schrudder', status: 'yes', timestamp: '2025-01-10T10:00:00Z' },
                    { userId: 2, userName: 'John Smith', status: 'yes', timestamp: '2025-01-10T14:30:00Z' }
                ],
                requiresResponse: true,
                remindersSent: []
            }
        }
    ], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#ff0000', backgroundColor: '#fef2f2' } },
    { id: 'american-dads', name: 'American Dads', logo: 'https://lh3.googleusercontent.com/d/1_YssV72EQ9Y3gtXzjM8S0eAJCGQMFpJ6', wins: 4, losses: 0, ties: 0, pf: 56, pa: 10, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [
        {
            id: 'dads-game-1',
            title: 'Championship Game',
            date: '2025-01-20',
            time: '14:00',
            type: 'game',
            location: 'Stadium Field',
            description: 'Important championship game vs rivals',
            rsvp: {
                enabled: true,
                responses: [
                    { userId: 3, userName: 'Player Pat', status: 'yes', timestamp: '2025-01-11T09:00:00Z' },
                    { userId: 4, userName: 'Coach Dave', status: 'yes', timestamp: '2025-01-11T16:00:00Z' }
                ],
                requiresResponse: true,
                remindersSent: []
            }
        }
    ], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#1d4ed8', backgroundColor: '#eff6ff' } },
    { id: 'indiana-lacers', name: 'Indiana Lacers', logo: 'https://lh3.googleusercontent.com/d/1grpa4h9wlU21hDZGMYjiWUZOHQEttN1U', wins: 4, losses: 3, ties: 0, pf: 55, pa: 63, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Box', musicUrl: '', style: { bannerUrl: '', primaryColor: '#047857', backgroundColor: '#ecfdf5' } },
    { id: 'cincinnati-trash-pandas', name: 'Cincinnati Trash Pandas', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 2, losses: 1, ties: 0, pf: 21, pa: 25, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Box', musicUrl: '', style: { bannerUrl: '', primaryColor: '#4b5563', backgroundColor: '#f3f4f6' } },
    { id: 'columbus-ball-hawgs', name: 'Columbus Ball Hawgs', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 1, losses: 0, ties: 0, pf: 17, pa: 7, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#f59e0b', backgroundColor: '#fffbeb' } },
    { id: 'indy-sabers', name: 'Indy Sabers', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 1, losses: 4, ties: 0, pf: 40, pa: 48, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Field', musicUrl: '', style: { bannerUrl: '', primaryColor: '#be185d', backgroundColor: '#fdf2f8' } },
    { id: 'dayton-eagles', name: 'Dayton Eagles', logo: 'https://lh3.googleusercontent.com/d/1BjyA_93A2g-9Iu2625m2I4uA6p4xX-37', wins: 0, losses: 6, ties: 0, pf: 37, pa: 79, contactEmail: 'coach@gmail.com', social: { twitter: '#', instagram: '#', facebook: '#' }, active: true, media: [], calendar: [], division: 'Box', musicUrl: '', style: { bannerUrl: '', primaryColor: '#581c87', backgroundColor: '#f5f3ff' } },
];

const initialPlayersList = [
    { id: 1, firstName: 'Chandler', lastName: 'Schrudder', nickname: 'Chan', email: 'cschrudder23@gmail.com', phone: '555-0101', number: 10, positions: ['Attack'], teams: ['oh10-lacrosse'], photo: `https://placehold.co/200x200/ff0000/FFFFFF?text=CS`, active: true, roles: ['coach'], handedness: 'Right' },
    { id: 2, firstName: 'John', lastName: 'Smith', nickname: 'Dad', email: 'j.smith@example.com', phone: '555-0102', number: 22, positions: ['Defense'], teams: ['american-dads'], photo: `https://placehold.co/200x200/1d4ed8/FFFFFF?text=JS`, active: true, handedness: 'Left' },
    { id: 3, firstName: 'Mike', lastName: 'Miller', nickname: 'Lacer', email: 'm.miller@example.com', phone: '555-0103', number: 15, positions: ['Middie'], teams: ['indiana-lacers'], photo: `https://placehold.co/200x200/047857/FFFFFF?text=MM`, active: true, handedness: 'Right' },
    { id: 4, firstName: 'Alex', lastName: 'Williams', nickname: 'Panda', email: 'a.williams@example.com', phone: '555-0104', number: 7, positions: ['Goalie'], teams: ['cincinnati-trash-pandas'], photo: `https://placehold.co/200x200/4b5563/FFFFFF?text=AW`, active: true, handedness: 'Right' },
    { id: 5, firstName: 'Brian', lastName: 'Davis', nickname: 'Hawg', email: 'b.davis@example.com', phone: '555-0105', number: 99, positions: ['Attack'], teams: ['columbus-ball-hawgs'], photo: `https://placehold.co/200x200/f59e0b/FFFFFF?text=BD`, active: true, handedness: 'Left' },
    { id: 6, firstName: 'Kevin', lastName: 'Brown', nickname: 'Saber', email: 'k.brown@example.com', phone: '555-0106', number: 1, positions: ['Defense'], teams: ['indy-sabers'], photo: `https://placehold.co/200x200/be185d/FFFFFF?text=KB`, active: true, handedness: 'Right' },
    { id: 7, firstName: 'Tom', lastName: 'Wilson', nickname: 'Eagle', email: 't.wilson@example.com', phone: '555-0107', number: 23, positions: ['Middie'], teams: ['dayton-eagles'], photo: `https://placehold.co/200x200/581c87/FFFFFF?text=TW`, active: false, handedness: 'Left' },
];

const initialGameTickerData = [
    { id: 1, homeTeam: 'oh10-lacrosse', awayTeam: 'american-dads', homeScore: 3, awayScore: 16, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 2, homeTeam: 'dayton-eagles', awayTeam: 'cincinnati-trash-pandas', homeScore: 5, awayScore: 10, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 3, homeTeam: 'indiana-lacers', awayTeam: 'american-dads', homeScore: 0, awayScore: 14, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 4, homeTeam: 'indy-sabers', awayTeam: 'cincinnati-trash-pandas', homeScore: 7, awayScore: 9, location: 'Dayton', type: 'Tournament', tournamentName: 'Dayton Classic', status: 'Final' },
    { id: 5, homeTeam: 'columbus-ball-hawgs', awayTeam: 'dayton-eagles', homeScore: 17, awayScore: 7, location: 'Columbus', type: 'League Game', tournamentName: null, status: 'Final' },
];

const initialLeagueSchedule = [
    { date: '2025-08-09', games: [ 
        { id: 1, home: 'oh10-lacrosse', away: 'american-dads', time: '1:00 PM', location: 'Dayton' },
        { id: 2, home: 'dayton-eagles', away: 'cincinnati-trash-pandas', time: '2:00 PM', location: 'Dayton' },
        { id: 3, home: 'indiana-lacers', away: 'american-dads', time: '3:00 PM', location: 'Dayton' },
    ] },
    { date: '2025-08-02', games: [ 
        { id: 6, home: 'indiana-lacers', away: 'oh10-lacrosse', time: '6:00 PM', location: 'Indy' },
        { id: 7, home: 'indy-sabers', away: 'dayton-eagles', time: '7:00 PM', location: 'Indy' },
    ] },
     { date: '2025-07-10', games: [ { id: 8, home: 'columbus-ball-hawgs', away: 'dayton-eagles', time: '7:00 PM', location: 'Columbus' } ] },
];

const newsFeed = [
    { id: 1, title: 'American Dads Dominate Dayton Classic', date: '2025-08-10', snippet: 'The American Dads team swept the competition at the Dayton Classic tournament this past weekend, securing the championship with a decisive 13-5 victory...' },
    { id: 2, title: 'Indy Gauntlet Tournament Recap', date: '2025-08-03', snippet: 'OH10 and the Indy Lacers came out on top in a hard-fought weekend of lacrosse at the Indy Gauntlet tournament...' },
];

// --- SECURITY & PERMISSIONS SYSTEM ---

// Define comprehensive permissions system
const PERMISSIONS = {
    // User Management
    'users.view': { name: 'View Users', category: 'User Management', description: 'View user list and profiles' },
    'users.create': { name: 'Create Users', category: 'User Management', description: 'Add new users to the system' },
    'users.edit': { name: 'Edit Users', category: 'User Management', description: 'Modify user information and roles' },
    'users.delete': { name: 'Delete Users', category: 'User Management', description: 'Remove users from the system' },
    
    // Team Management
    'teams.view': { name: 'View Teams', category: 'Team Management', description: 'View team information' },
    'teams.create': { name: 'Create Teams', category: 'Team Management', description: 'Add new teams' },
    'teams.edit': { name: 'Edit Teams', category: 'Team Management', description: 'Modify team information' },
    'teams.delete': { name: 'Delete Teams', category: 'Team Management', description: 'Remove teams' },
    'teams.manage_own': { name: 'Manage Own Team', category: 'Team Management', description: 'Manage assigned team only' },
    
    // Player Management  
    'players.view': { name: 'View Players', category: 'Player Management', description: 'View player roster and stats' },
    'players.add': { name: 'Add Players', category: 'Player Management', description: 'Add players to teams' },
    'players.edit': { name: 'Edit Players', category: 'Player Management', description: 'Modify player information' },
    'players.remove': { name: 'Remove Players', category: 'Player Management', description: 'Remove players from teams' },
    
    // Schedule & Events
    'events.view': { name: 'View Events', category: 'Schedule & Events', description: 'View game and event schedules' },
    'events.create': { name: 'Create Events', category: 'Schedule & Events', description: 'Create new games and events' },
    'events.edit': { name: 'Edit Events', category: 'Schedule & Events', description: 'Modify existing events' },
    'events.delete': { name: 'Delete Events', category: 'Schedule & Events', description: 'Remove events from calendar' },
    
    // Media Management
    'media.view': { name: 'View Media', category: 'Media Management', description: 'View photos and videos' },
    'media.upload': { name: 'Upload Media', category: 'Media Management', description: 'Upload new photos and videos' },
    'media.edit': { name: 'Edit Media', category: 'Media Management', description: 'Edit media metadata and organize galleries' },
    'media.delete': { name: 'Delete Media', category: 'Media Management', description: 'Remove photos and videos' },
    
    // System Administration
    'system.settings': { name: 'System Settings', category: 'System Administration', description: 'Manage website settings and configuration' },
    'system.roles': { name: 'Role Management', category: 'System Administration', description: 'Create and manage user roles and permissions' },
    'system.invitations': { name: 'Manage Invitations', category: 'System Administration', description: 'Send invitations and manage access requests' },
    'system.admin_access': { name: 'Admin Access', category: 'System Administration', description: 'Access administrative functions' }
};

// Define system roles with their permissions
const SYSTEM_ROLES = {
    'super_admin': {
        id: 'super_admin',
        name: 'Super Administrator',
        description: 'Full system access with all permissions',
        isSystemRole: true,
        permissions: Object.keys(PERMISSIONS)
    },
    'league_admin': {
        id: 'league_admin', 
        name: 'League Administrator',
        description: 'League management with most administrative functions',
        isSystemRole: true,
        permissions: [
            'users.view', 'users.create', 'users.edit',
            'teams.view', 'teams.create', 'teams.edit', 'teams.delete',
            'players.view', 'players.add', 'players.edit', 'players.remove',
            'events.view', 'events.create', 'events.edit', 'events.delete',
            'media.view', 'media.upload', 'media.edit', 'media.delete',
            'system.settings', 'system.invitations', 'system.admin_access'
        ]
    },
    'team_coach': {
        id: 'team_coach',
        name: 'Team Coach',
        description: 'Team and player management for assigned team',
        isSystemRole: true,
        permissions: [
            'teams.view', 'teams.manage_own',
            'players.view', 'players.add', 'players.edit',
            'events.view', 'events.create', 'events.edit',
            'media.view', 'media.upload'
        ]
    },
    'player': {
        id: 'player',
        name: 'Player',
        description: 'Basic access to view team and league information',
        isSystemRole: true,
        permissions: [
            'teams.view', 'players.view', 'events.view', 'media.view'
        ]
    }
};

// Permission checking utilities
const hasPermission = (user, permission) => {
    if (!user || !user.roleIds) return false;
    return user.roleIds.some(roleId => {
        const role = getAllRoles().find(r => r.id === roleId);
        return role && role.permissions.includes(permission);
    });
};

const hasAllPermissions = (user, permissions) => {
    return permissions.every(permission => hasPermission(user, permission));
};

const hasAnyPermission = (user, permissions) => {
    return permissions.some(permission => hasPermission(user, permission));
};

const getAllRoles = () => {
    // This would normally come from a database
    // For now, return system roles + any custom roles from localStorage
    const customRoles = JSON.parse(localStorage.getItem('customRoles') || '[]');
    return [...Object.values(SYSTEM_ROLES), ...customRoles];
};

// Role Management Component
const RoleManager = ({ users, setUsers }) => {
    const [editingRole, setEditingRole] = useState(null);
    const [roles, setRoles] = useState(() => getAllRoles());

    const handleSaveRole = (e) => {
        e.preventDefault();
        
        if (editingRole.id && !editingRole.isSystemRole) {
            // Edit existing custom role
            const updatedRoles = roles.map(r => 
                r.id === editingRole.id ? editingRole : r
            );
            setRoles(updatedRoles);
            
            // Save custom roles to localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
        } else if (!editingRole.id) {
            // Create new role
            const newRole = {
                ...editingRole,
                id: `custom_${Date.now()}`,
                isSystemRole: false
            };
            
            const updatedRoles = [...roles, newRole];
            setRoles(updatedRoles);
            
            // Save custom roles to localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
        }
        
        setEditingRole(null);
    };

    const handleDeleteRole = (roleId) => {
        const role = roles.find(r => r.id === roleId);
        if (role && !role.isSystemRole && window.confirm(`Delete role "${role.name}"?`)) {
            const updatedRoles = roles.filter(r => r.id !== roleId);
            setRoles(updatedRoles);
            
            // Update localStorage
            const customRoles = updatedRoles.filter(r => !r.isSystemRole);
            localStorage.setItem('customRoles', JSON.stringify(customRoles));
            
            // Update users who had this role
            setUsers(currentUsers => 
                currentUsers.map(user => ({
                    ...user,
                    roleIds: (user.roleIds || []).filter(id => id !== roleId)
                }))
            );
        }
    };

    const getPermissionsByCategory = () => {
        const categories = {};
        Object.entries(PERMISSIONS).forEach(([key, permission]) => {
            if (!categories[permission.category]) {
                categories[permission.category] = [];
            }
            categories[permission.category].push({ key, ...permission });
        });
        return categories;
    };

    const permissionCategories = getPermissionsByCategory();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">Role Management</h3>
                <button 
                    onClick={() => setEditingRole({name: '', description: '', permissions: []})}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Create Role
                </button>
            </div>

            {/* Role List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {roles.map(role => (
                    <div key={role.id} className="bg-slate-50 p-4 rounded-lg border hover:border-slate-300 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex-grow">
                                <h4 className="font-semibold text-slate-800 mb-1">{role.name}</h4>
                                {role.isSystemRole && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">System Role</span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => setEditingRole(role)}
                                    className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded transition-colors"
                                    title={role.isSystemRole ? "View Permissions" : "Edit Role"}
                                >
                                    <Edit size={16} />
                                </button>
                                {!role.isSystemRole && (
                                    <button 
                                        onClick={() => handleDeleteRole(role.id)}
                                        className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded transition-colors"
                                        title="Delete Role"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">{role.description}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-slate-500">
                                {role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}
                            </p>
                            <button 
                                onClick={() => setEditingRole(role)}
                                className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1 rounded transition-colors"
                            >
                                {role.isSystemRole ? 'View Details' : 'Edit Permissions'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Role Edit Modal */}
            {editingRole && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingRole.id ? 'Edit Role' : 'Create New Role'}
                        </h3>
                        
                        <form onSubmit={handleSaveRole}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Role Details */}
                                <div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                                        <input 
                                            type="text"
                                            value={editingRole.name || ''}
                                            onChange={e => setEditingRole(prev => ({...prev, name: e.target.value}))}
                                            className="w-full p-2 border rounded"
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea 
                                            value={editingRole.description || ''}
                                            onChange={e => setEditingRole(prev => ({...prev, description: e.target.value}))}
                                            className="w-full p-2 border rounded h-20"
                                            placeholder="Describe what this role can do..."
                                        />
                                    </div>
                                </div>

                                {/* Permissions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">Permissions</label>
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {Object.entries(permissionCategories).map(([category, permissions]) => (
                                            <div key={category} className="border rounded p-3">
                                                <h4 className="font-semibold text-sm text-slate-700 mb-2">{category}</h4>
                                                <div className="space-y-1">
                                                    {permissions.map(permission => (
                                                        <label key={permission.key} className="flex items-start space-x-2 text-sm">
                                                            <input 
                                                                type="checkbox"
                                                                checked={editingRole.permissions?.includes(permission.key) || false}
                                                                onChange={e => {
                                                                    const permissions = editingRole.permissions || [];
                                                                    if (e.target.checked) {
                                                                        setEditingRole(prev => ({
                                                                            ...prev,
                                                                            permissions: [...permissions, permission.key]
                                                                        }));
                                                                    } else {
                                                                        setEditingRole(prev => ({
                                                                            ...prev,
                                                                            permissions: permissions.filter(p => p !== permission.key)
                                                                        }));
                                                                    }
                                                                }}
                                                                className="mt-1"
                                                            />
                                                            <div>
                                                                <div className="font-medium">{permission.name}</div>
                                                                <div className="text-xs text-slate-500">{permission.description}</div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setEditingRole(null)}
                                    className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                >
                                    {editingRole.id ? 'Update Role' : 'Create Role'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
const GameTicker = ({teams, gameTickerData, onTeamClick, websiteStyle, onNavigate}) => {
    const getTeam = (id) => teams.find(t => t.id === id);
    const tickerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Combine games and upcoming events with tournament consolidation and filtering
    const allItems = useMemo(() => {
        // Get ticker filter settings from websiteStyle
        const tickerFilters = websiteStyle?.tickerFilters || {
            games: true,
            tournaments: true,
            practices: true,
            meetings: true,
            social: true,
            other: true
        };

        // Get date range settings
        const lookBackDays = websiteStyle?.tickerLookBack || 7;
        const lookForwardDays = websiteStyle?.tickerLookForward || 14;
        
        const today = new Date();
        const lookBackDate = new Date(today);
        lookBackDate.setDate(today.getDate() - lookBackDays);
        
        const lookForwardDate = new Date(today);
        lookForwardDate.setDate(today.getDate() + lookForwardDays);

        // Add date information to games from schedule
        const gamesWithDates = gameTickerData.map(game => {
            // Find the game in the schedule to get its date
            let gameDate = null;
            for (const day of [
                { date: '2025-08-09', games: [ 
                    { id: 1, home: 'oh10-lacrosse', away: 'american-dads', time: '1:00 PM', location: 'Dayton' },
                    { id: 2, home: 'dayton-eagles', away: 'cincinnati-trash-pandas', time: '2:00 PM', location: 'Dayton' },
                    { id: 3, home: 'indiana-lacers', away: 'american-dads', time: '3:00 PM', location: 'Dayton' },
                ] },
                { date: '2025-08-02', games: [ 
                    { id: 6, home: 'indiana-lacers', away: 'oh10-lacrosse', time: '6:00 PM', location: 'Indy' },
                    { id: 7, home: 'indy-sabers', away: 'dayton-eagles', time: '7:00 PM', location: 'Indy' },
                ] },
                { date: '2025-07-10', games: [ { id: 8, home: 'columbus-ball-hawgs', away: 'dayton-eagles', time: '7:00 PM', location: 'Columbus' } ] },
            ]) {
                const scheduleGame = day.games.find(g => g.id === game.id);
                if (scheduleGame) {
                    gameDate = day.date;
                    break;
                }
            }
            return {...game, gameDate, type: game.type || 'game', itemType: 'game'};
        }).filter(game => {
            // Apply date range filtering
            if (game.gameDate) {
                const gameDate = new Date(game.gameDate);
                return gameDate >= lookBackDate && gameDate <= lookForwardDate;
            }
            return true; // Include games without dates for now
        });
        
        // Group tournament games by tournament name
        const regularGames = [];
        const tournaments = new Map();
        
        gamesWithDates.forEach(game => {
            if (game.type === 'Tournament' && game.tournamentName) {
                if (tickerFilters.tournaments) {
                    if (!tournaments.has(game.tournamentName)) {
                        tournaments.set(game.tournamentName, {
                            tournamentName: game.tournamentName,
                            location: game.location,
                            gameDate: game.gameDate,
                            games: [],
                            itemType: 'tournament'
                        });
                    }
                    tournaments.get(game.tournamentName).games.push(game);
                }
            } else {
                // All non-tournament games are regular games (includes 'League Game', 'game', etc.)
                if (tickerFilters.games) {
                    regularGames.push(game);
                }
            }
        });
        
        // Convert tournament Map to array
        const tournamentItems = Array.from(tournaments.values());
        
        const upcomingEvents = teams.flatMap(team => 
            (team.calendar || [])
                .filter(event => {
                    // Date range filter
                    const eventDate = new Date(event.date);
                    if (eventDate < lookBackDate || eventDate > lookForwardDate) return false;
                    
                    // Type filter
                    const eventType = event.type?.toLowerCase() || 'other';
                    if (eventType.includes('practice') && !tickerFilters.practices) return false;
                    if (eventType.includes('meeting') && !tickerFilters.meetings) return false;
                    if (eventType.includes('social') && !tickerFilters.social) return false;
                    if (!['practice', 'meeting', 'social'].some(type => eventType.includes(type)) && !tickerFilters.other) return false;
                    
                    return true;
                })
                .slice(0, 3) // Limit per team
                .map(event => ({
                    ...event,
                    teamName: team.name,
                    teamLogo: team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team',
                    teamId: team.id,
                    itemType: 'event',
                    status: 'Scheduled' // Add scheduled status for upcoming events
                }))
        ).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 5); // Show next 5 events

        return [...regularGames, ...tournamentItems, ...upcomingEvents];
    }, [gameTickerData, teams, websiteStyle?.tickerFilters]);

    useEffect(() => {
        const tickerElement = tickerRef.current;
        if (!tickerElement) return;

        let animationFrameId;

        const scroll = () => {
            if (!isHovering) {
                tickerElement.scrollLeft += 1; // Scroll right to left
                if (tickerElement.scrollLeft >= tickerElement.scrollWidth / 2) {
                    tickerElement.scrollLeft = 0;
                }
            }
            animationFrameId = requestAnimationFrame(scroll);
        };
        
        animationFrameId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isHovering]);
    
    return (
        <div 
            className="text-white py-2 overflow-hidden shadow-lg"
            style={{ backgroundColor: websiteStyle?.tickerColor || '#1e293b' }}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div ref={tickerRef} className="flex space-x-6 overflow-x-auto no-scrollbar">
                {allItems.length === 0 ? (
                    // Show placeholder when no items
                    <div className="flex-shrink-0 w-72 rounded-lg p-2 border opacity-50" style={{ 
                        backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                        borderColor: websiteStyle?.tickerBorderColor || '#475569'
                    }}>
                        <div className="text-center py-4">
                            <span className="text-slate-400 text-sm">No ticker items to display</span>
                        </div>
                    </div>
                ) : (
                    [...allItems, ...allItems].map((item, index) => {
                    if (item.itemType === 'game') {
                        const home = getTeam(item.homeTeam);
                        const away = getTeam(item.awayTeam);
                        if (!home || !away) return null;
                        
                        return (
                            <div key={`game-${index}`} className="flex-shrink-0 w-72 rounded-lg p-2 border" style={{ 
                                backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                borderColor: websiteStyle?.tickerBorderColor || '#475569'
                            }}>
                                <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                    <span>{item.location}</span>
                                    <span className="font-bold text-xs text-red-400">GAME</span>
                                </div>
                                <div className="space-y-1 mb-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <button onClick={() => onTeamClick(home.id)} className="flex items-center gap-2 hover:opacity-80">
                                            <img src={home.logo} alt={home.name} className="w-6 h-6 rounded-full bg-white p-0.5 object-contain" />
                                            <span className="font-medium text-white">{home.name}</span>
                                        </button>
                                        <span className="font-bold text-lg text-white">{item.homeScore ?? '-'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <button onClick={() => onTeamClick(away.id)} className="flex items-center gap-2 hover:opacity-80">
                                            <img src={away.logo} alt={away.name} className="w-6 h-6 rounded-full bg-white p-0.5 object-contain" />
                                            <span className="font-medium text-white">{away.name}</span>
                                        </button>
                                        <span className="font-bold text-lg text-white">{item.awayScore ?? '-'}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {item.gameDate ? new Date(item.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                                    </span>
                                    <span className="font-bold text-green-400 tracking-wider">{item.status}</span>
                                </div>
                            </div>
                        );
                    } else if (item.itemType === 'tournament') {
                        // Simplified consolidated tournament card
                        const completedGames = item.games.filter(g => g.status === 'Final');
                        const totalGames = item.games.length;
                        
                        return (
                            <div 
                                key={`tournament-${index}`} 
                                className="flex-shrink-0 w-80 rounded-lg p-3 border cursor-pointer hover:opacity-80 transition-opacity" 
                                style={{ 
                                    backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                    borderColor: websiteStyle?.tickerBorderColor || '#475569'
                                }}
                                onClick={() => {
                                    // Navigate to Events & Schedule page to show tournament details
                                    onNavigate('events-schedule');
                                }}
                                title="Click to view tournament details"
                            >
                                <div className="text-xs mb-2 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                    <span>{item.location}</span>
                                    <span className="font-bold text-xs text-yellow-400">TOURNAMENT</span>
                                </div>
                                <div className="mb-2">
                                    <div className="text-lg font-bold text-white mb-1">{item.tournamentName}</div>
                                    <div className="text-sm text-yellow-300">{completedGames.length}/{totalGames} Games Complete</div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {item.gameDate ? new Date(item.gameDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                                    </span>
                                    <span className="font-bold tracking-wider text-yellow-400">
                                        {completedGames.length === totalGames ? 'COMPLETE' : 'IN PROGRESS'}
                                    </span>
                                </div>
                                <div className="text-xs text-slate-400 mt-1 italic">Click for details</div>
                            </div>
                        );
                    } else {
                        // Event item
                        return (
                            <div key={`event-${index}`} className="flex-shrink-0 w-72 rounded-lg p-2 border" style={{ 
                                backgroundColor: websiteStyle?.tickerItemColor || '#334155',
                                borderColor: websiteStyle?.tickerBorderColor || '#475569'
                            }}>
                                <div className="text-xs mb-1 flex justify-between" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                    <span>{item.location || 'TBA'}</span>
                                    <span className="font-bold text-xs text-blue-400">EVENT</span>
                                </div>
                                <div className="space-y-1 mb-2">
                                    <button onClick={() => onTeamClick(item.teamId)} className="flex items-center gap-2 hover:opacity-80 w-full">
                                        <img src={item.teamLogo} alt={item.teamName} className="w-6 h-6 rounded-full bg-white p-0.5 object-contain" />
                                        <span className="font-medium text-white text-left">{item.teamName}</span>
                                    </button>
                                    <div className="text-sm text-white font-semibold">{item.title}</div>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="font-semibold" style={{ color: websiteStyle?.tickerTextColor || '#94a3b8' }}>
                                        {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })} • {item.time}
                                    </span>
                                    <span className="font-bold tracking-wider text-orange-400">
                                        {item.status || 'SCHEDULED'}
                                    </span>
                                </div>
                            </div>
                        );
                    }
                }))}
            </div>
        </div>
    );
};

const StatCard = ({ title, value, color }) => (
    <div className={`bg-white p-4 rounded-lg shadow-md text-center ${color}`}>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
    </div>
);

const PlayerCard = ({ player, teamStyle, onClick }) => (
    <div
        className="bg-white rounded-xl shadow-lg overflow-hidden transform transition-transform hover:scale-105 duration-300 border-4 cursor-pointer group"
        style={{ borderColor: teamStyle?.primaryColor || '#cccccc' }}
        onClick={onClick}
        title="Click for player details"
    >
        <div className="relative overflow-hidden" style={{ aspectRatio: '3/4', minHeight: '200px' }}>
            <EnhancedImage
                src={player.photo}
                alt={`${player.firstName} ${player.lastName}`}
                fit={player.imageFit || 'cover'}
                fallback={`https://ui-avatars.com/api/?name=${player.firstName}+${player.lastName}&background=random&size=400`}
                showFitControls={false} // Can be enabled for admin editing
                className="w-full h-full"
            />
            
            {/* Hover overlay for image fit options */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black bg-opacity-60 rounded px-2 py-1 text-xs text-white">
                    {player.imageFit || 'cover'}
                </div>
            </div>
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                <h3 className="text-white font-bold text-lg">{player.firstName} {player.lastName}</h3>
                <p className="text-white text-sm">#{player.number}</p>
            </div>
        </div>
        <div className="p-4">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-600">
                    {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                </span>
                {player.roles && player.roles.includes('coach') && (
                    <span className="bg-yellow-500 text-white px-2 py-1 rounded text-xs font-bold">COACH</span>
                )}
            </div>
            {player.nickname && (
                <p className="text-slate-500 text-sm">"{player.nickname}"</p>
            )}
        </div>
    </div>
);

// Player Card Modal Component
const PlayerCardModal = ({ player, teamStyle, teams, isOpen, onClose }) => {
    if (!isOpen || !player) return null;

    // Get the primary team for logo display
    const primaryTeam = teams?.find(t => player.teams && player.teams.includes(t.id));

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-sm w-full transform transition-all overflow-hidden relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow"
                >
                    <X className="h-5 w-5 text-slate-600" />
                </button>

                {/* Large Player Photo Section - Match typical portrait proportions */}
                <div className="relative h-96 overflow-hidden bg-gradient-to-b from-slate-200 to-slate-300">
                    <img 
                        src={player.photo || `https://ui-avatars.com/api/?name=${player.firstName}+${player.lastName}&background=random&size=600`} 
                        alt={`${player.firstName} ${player.lastName}`}
                        className="w-full h-full object-contain"
                    />
                    
                    {/* Team logo circle overlay */}
                    {primaryTeam && (
                        <div className="absolute top-4 left-4 w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                            <img 
                                src={primaryTeam.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} 
                                alt={primaryTeam.name}
                                className="w-12 h-12 rounded-full object-contain"
                            />
                        </div>
                    )}

                    {/* Coach badge */}
                    {player.roles && player.roles.includes('coach') && (
                        <div className="absolute top-4 right-20 bg-yellow-500 px-3 py-1 rounded-full text-sm font-bold text-black shadow-lg">
                            COACH
                        </div>
                    )}
                </div>

                {/* Player details section */}
                <div className="p-6 relative">
                    {/* Player name, nickname, and position */}
                    <div className="text-center mb-4">
                        <h2 className="text-3xl font-bold text-slate-800 mb-1">{player.firstName} {player.lastName}</h2>
                        {player.nickname && (
                            <p className="text-xl text-slate-600 mb-2">"{player.nickname}"</p>
                        )}
                        <p className="text-lg text-slate-500">
                            {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                        </p>
                        {/* Handedness field for future use */}
                        {player.handedness && (
                            <p className="text-sm text-slate-400 mt-1">
                                {player.handedness} Handed
                            </p>
                        )}
                    </div>

                    {/* Teams */}
                    {player.teams && player.teams.length > 1 && (
                        <div className="mb-4">
                            <h3 className="font-semibold text-slate-800 mb-2 text-center">Teams</h3>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {player.teams.map(teamId => {
                                    const team = teams?.find(t => t.id === teamId);
                                    return team ? (
                                        <span 
                                            key={teamId}
                                            className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center"
                                        >
                                            <img 
                                                src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} 
                                                alt={team.name}
                                                className="w-4 h-4 rounded-full object-contain mr-2"
                                            />
                                            {team.name}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        </div>
                    )}

                    {/* Jersey number - bottom right corner */}
                    <div className="absolute bottom-4 right-4">
                        <div 
                            className="text-slate-300 text-5xl font-bold opacity-50"
                        >
                            #{player.number}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ContactCard = ({ entity }) => {
    const [messageSent, setMessageSent] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(`Message sent to ${entity.name}`);
        setMessageSent(true);
        setTimeout(() => setMessageSent(false), 3000);
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Contact {entity.name}</h2>
            {messageSent ? (
                <div className="text-center p-4 bg-green-100 text-green-800 rounded-md">Message Sent!</div>
            ) : (
                 <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" placeholder="Your Name" className="w-full p-2 border rounded" required />
                    <input type="email" placeholder="Your Email" className="w-full p-2 border rounded" required />
                    <textarea placeholder="Your Message" rows="4" className="w-full p-2 border rounded" required></textarea>
                    <button type="submit" className="w-full bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Send Message</button>
                </form>
            )}
        </div>
    );
};

const SocialCard = ({ entity }) => {
    const [activeTab, setActiveTab] = useState('links');

    const getEmbedUrl = (url, platform) => {
        if (!url || url === '#') return null;
        
        try {
            if (platform === 'twitter') {
                // Extract Twitter username from URL
                const match = url.match(/twitter\.com\/([^/?]+)/);
                if (match) {
                    const username = match[1];
                    return `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}?dnt=false&embedId=twitter-widget-0&frame=false&hideBorder=false&hideFooter=false&hideHeader=false&hideScrollBar=false&lang=en&maxHeight=400px&origin=${window.location.origin}&sessionId=&theme=light&widgetsVersion=82e1070%3A1619632193066&width=340px`;
                }
            } else if (platform === 'instagram') {
                // For Instagram, we'll show a link since embedding requires approval
                return null;
            } else if (platform === 'facebook') {
                // For Facebook, we'll use the page plugin
                const match = url.match(/facebook\.com\/([^/?]+)/);
                if (match) {
                    const pageId = match[1];
                    return `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=340&height=400&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId`;
                }
            }
        } catch (error) {
            console.error('Error generating embed URL:', error);
        }
        return null;
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Follow Us</h2>
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 border-b">
                <button 
                    onClick={() => setActiveTab('links')}
                    className={`pb-2 px-1 ${activeTab === 'links' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    Quick Links
                </button>
                <button 
                    onClick={() => setActiveTab('feeds')}
                    className={`pb-2 px-1 ${activeTab === 'feeds' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    Live Feeds
                </button>
            </div>

            {activeTab === 'links' && (
                <div className="text-center">
                    <div className="flex space-x-6 justify-center mb-6">
                        <a href={entity.social.twitter} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-400 transition-colors">
                            <Twitter size={32} />
                            <div className="text-xs mt-1">Twitter</div>
                        </a>
                        <a href={entity.social.instagram} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-pink-500 transition-colors">
                            <Instagram size={32} />
                            <div className="text-xs mt-1">Instagram</div>
                        </a>
                        <a href={entity.social.facebook} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-blue-600 transition-colors">
                            <Facebook size={32} />
                            <div className="text-xs mt-1">Facebook</div>
                        </a>
                    </div>
                    <p className="text-sm text-slate-600">Click the icons above to visit our social media pages</p>
                </div>
            )}

            {activeTab === 'feeds' && (
                <div className="space-y-6">
                    {/* Twitter Embed */}
                    {entity.social.twitter && entity.social.twitter !== '#' && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                                <Twitter className="mr-2 text-blue-400" size={18} />
                                Twitter Feed
                            </h4>
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-600">
                                <p className="mb-2">Live Twitter feed</p>
                                <a 
                                    href={entity.social.twitter} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 underline"
                                >
                                    View our latest tweets →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Facebook Embed */}
                    {entity.social.facebook && entity.social.facebook !== '#' && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                                <Facebook className="mr-2 text-blue-600" size={18} />
                                Facebook Page
                            </h4>
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-600">
                                <p className="mb-2">Latest Facebook posts</p>
                                <a 
                                    href={entity.social.facebook} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-700 underline"
                                >
                                    Visit our Facebook page →
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Instagram */}
                    {entity.social.instagram && entity.social.instagram !== '#' && (
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center">
                                <Instagram className="mr-2 text-pink-500" size={18} />
                                Instagram Photos
                            </h4>
                            <div className="bg-slate-50 p-4 rounded text-center text-slate-600">
                                <p className="mb-2">Latest Instagram photos</p>
                                <a 
                                    href={entity.social.instagram} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-pink-500 hover:text-pink-700 underline"
                                >
                                    View our Instagram →
                                </a>
                            </div>
                        </div>
                    )}

                    {(!entity.social.twitter || entity.social.twitter === '#') && 
                     (!entity.social.facebook || entity.social.facebook === '#') && 
                     (!entity.social.instagram || entity.social.instagram === '#') && (
                        <div className="text-center py-8 text-slate-500">
                            <p>No social media accounts configured yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- IMAGE CROP TOOL DISABLED ---
// Advanced Image Cropping Tool - Enhanced with zoom/pan and fixed handles
const ImageCropTool = ({ imageUrl, onCrop, onCancel, aspectRatio: initialAspectRatio = 'free' }) => {
    
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cropArea, setCropArea] = useState({ x: 50, y: 50, width: 200, height: 200 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState('');
    const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropX: 0, cropY: 0 });
    const [currentAspectRatio, setCurrentAspectRatio] = useState(initialAspectRatio || 'free');
    const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
    const [imageScale, setImageScale] = useState(1);
    const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
    const [isPanningImage, setIsPanningImage] = useState(false);

    // Aspect ratio configurations with proper labels
    const aspectRatios = {
        'free': { ratio: null, label: 'Free Form', category: 'flexible' },
        '1:1': { ratio: 1, label: '1:1 Square', category: 'standard' },
        '4:3': { ratio: 4/3, label: '4:3 Standard', category: 'standard' },
        '3:2': { ratio: 3/2, label: '3:2 Photo', category: 'standard' },
        '16:9': { ratio: 16/9, label: '16:9 Widescreen', category: 'wide' },
        '21:9': { ratio: 21/9, label: '21:9 Ultra Wide', category: 'wide' },
        '2:1': { ratio: 2/1, label: '2:1 Banner', category: 'banner' },
        '3:1': { ratio: 3/1, label: '3:1 Wide Banner', category: 'banner' },
        '5:1': { ratio: 5/1, label: '5:1 Header Banner', category: 'banner' },
        '1:2': { ratio: 1/2, label: '1:2 Vertical Banner', category: 'vertical' },
        '2:3': { ratio: 2/3, label: '2:3 Portrait', category: 'vertical' },
        '3:4': { ratio: 3/4, label: '3:4 Portrait', category: 'vertical' },
        '9:16': { ratio: 9/16, label: '9:16 Mobile/Story', category: 'vertical' }
    };

    // Prevent navigation while crop tool is active
    useEffect(() => {
        const preventNavigation = (e) => {
            e.preventDefault();
            return '';
        };
        
        const preventHashChange = (e) => {
            e.preventDefault();
            e.stopPropagation();
        };

        // Add navigation prevention
        window.addEventListener('beforeunload', preventNavigation);
        window.addEventListener('hashchange', preventHashChange, true); // Use capture phase
        
        // Use overflow hidden instead of pointer-events to prevent scrolling without blocking interactions
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        
        return () => {
            window.removeEventListener('beforeunload', preventNavigation);
            window.removeEventListener('hashchange', preventHashChange, true);
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    // Ensure currentAspectRatio is always valid
    useEffect(() => {
        if (!aspectRatios[currentAspectRatio]) {
            setCurrentAspectRatio('free');
        }
    }, [currentAspectRatio]);

    // Initialize image and canvas
    useEffect(() => {
        if (imageUrl) {
            setIsLoading(true);
            
            const loadImage = (url, useCors = true) => {
                return new Promise((resolve, reject) => {
                    const img = new window.Image();
                    
                    // Handle CORS based on URL type and flag
                    if (useCors && !url.startsWith('blob:') && !url.startsWith('data:')) {
                        img.crossOrigin = "anonymous";
                    }
                    
                    const timeout = setTimeout(() => {
                        reject(new Error('Image loading timeout'));
                    }, 15000); // 15 second timeout
                    
                    img.onload = () => {
                        clearTimeout(timeout);
                        resolve(img);
                    };
                    
                    img.onerror = (e) => {
                        clearTimeout(timeout);
                        reject(new Error(`Failed to load image: ${e.message || 'Unknown error'}`));
                    };
                    
                    img.src = url;
                });
            };
            
            const initializeCanvas = (img) => {
                imageRef.current = img;
                
                // Set canvas size based on container
                const canvas = canvasRef.current;
                if (canvas) {
                    const container = canvas.parentElement;
                    const maxWidth = Math.min(container.clientWidth - 32, 800);
                    const maxHeight = Math.min(container.clientHeight - 32, 600);
                    
                    // Calculate display size maintaining aspect ratio
                    const imageAspect = img.width / img.height;
                    let displayWidth, displayHeight;
                    
                    if (imageAspect > maxWidth / maxHeight) {
                        displayWidth = maxWidth;
                        displayHeight = maxWidth / imageAspect;
                    } else {
                        displayHeight = maxHeight;
                        displayWidth = maxHeight * imageAspect;
                    }
                    
                    // Reset image transformation when new image loads
                    setImageScale(1);
                    setImagePan({ x: 0, y: 0 });
                    
                    // Initialize crop area in center
                    const cropSize = Math.min(displayWidth, displayHeight) * 0.6;
                    let cropWidth = cropSize;
                    let cropHeight = cropSize;
                    
                    // Apply initial aspect ratio
                    const ratioConfig = aspectRatios[currentAspectRatio] || aspectRatios['free'];
                    if (ratioConfig && ratioConfig.ratio) {
                        cropHeight = cropWidth / ratioConfig.ratio;
                    }
                    
                    const newCropArea = {
                        x: (displayWidth - cropWidth) / 2,
                        y: (displayHeight - cropHeight) / 2,
                        width: cropWidth,
                        height: cropHeight
                    };
                    
                    // Set all state at once, then force canvas redraw
                    setCanvasSize({ width: displayWidth, height: displayHeight });
                    setCropArea(newCropArea);
                    setIsLoading(false);
                    
                    // Force immediate canvas redraw after state updates
                    setTimeout(() => {
                        if (canvasRef.current && imageRef.current) {
                            drawCanvas();
                        }
                    }, 10);
                } else {
                    setIsLoading(false);
                }
            };
            
            // Try loading with CORS first, then without if it fails
            loadImage(imageUrl, true)
                .then(initializeCanvas)
                .catch((error) => {
                    return loadImage(imageUrl, false)
                        .then(initializeCanvas);
                })
                .catch((error) => {
                    setIsLoading(false);
                    alert(`Failed to load image: ${error.message}\n\nPlease try:\n• Uploading a new image file\n• Using a different image URL\n• Checking your internet connection`);
                });
        }
    }, [imageUrl]);

    // Draw canvas whenever crop area or image transform changes
    useEffect(() => {
        drawCanvas();
    }, [cropArea, canvasSize, imageScale, imagePan]);

    // Force redraw when image loads and loading state changes
    useEffect(() => {
        if (!isLoading && imageRef.current && canvasRef.current) {
            // Small delay to ensure all state updates are complete
            const timeoutId = setTimeout(() => {
                drawCanvas();
            }, 10);
            return () => clearTimeout(timeoutId);
        }
    }, [isLoading]);

    const drawCanvas = () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img || canvasSize.width === 0 || canvasSize.height === 0) return;

        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            // Set canvas size
            canvas.width = canvasSize.width;
            canvas.height = canvasSize.height;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Calculate image position and size with scaling and panning
            const scaledWidth = canvasSize.width * imageScale;
            const scaledHeight = canvasSize.height * imageScale;
            const imageX = (canvasSize.width - scaledWidth) / 2 + imagePan.x;
            const imageY = (canvasSize.height - scaledHeight) / 2 + imagePan.y;

            // Draw image with scaling and panning
            ctx.drawImage(img, imageX, imageY, scaledWidth, scaledHeight);

            // Draw dark overlay
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Clear crop area to show unmasked image
            ctx.save();
            ctx.beginPath();
            ctx.rect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
            ctx.clip();
            ctx.clearRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);
            ctx.drawImage(img, imageX, imageY, scaledWidth, scaledHeight);
            ctx.restore();

            // Draw crop border
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.strokeRect(cropArea.x, cropArea.y, cropArea.width, cropArea.height);

            // Draw resize handles
            const handleSize = 12;
            ctx.fillStyle = '#3b82f6';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            
            // Corner handles
            const corners = [
                { x: cropArea.x, y: cropArea.y }, // top-left
                { x: cropArea.x + cropArea.width, y: cropArea.y }, // top-right
                { x: cropArea.x, y: cropArea.y + cropArea.height }, // bottom-left
                { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height } // bottom-right
            ];
            
            corners.forEach(corner => {
                ctx.fillRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
                ctx.strokeRect(corner.x - handleSize/2, corner.y - handleSize/2, handleSize, handleSize);
            });

            // Side handles (only if not maintaining aspect ratio)
            if (!(aspectRatios[currentAspectRatio] || aspectRatios['free']).ratio) {
                const sides = [
                    { x: cropArea.x + cropArea.width/2, y: cropArea.y }, // top
                    { x: cropArea.x + cropArea.width, y: cropArea.y + cropArea.height/2 }, // right
                    { x: cropArea.x + cropArea.width/2, y: cropArea.y + cropArea.height }, // bottom
                    { x: cropArea.x, y: cropArea.y + cropArea.height/2 } // left
                ];
                
                sides.forEach(side => {
                    ctx.fillRect(side.x - handleSize/2, side.y - handleSize/2, handleSize, handleSize);
                    ctx.strokeRect(side.x - handleSize/2, side.y - handleSize/2, handleSize, handleSize);
                });
            }
        } catch (error) {
            console.error('Error drawing canvas:', error);
        }
    };

    const getHandleType = (x, y) => {
        const handleSize = 16; // Larger for easier interaction
        const { x: cropX, y: cropY, width, height } = cropArea;
        
        // Check corners first (priority over sides)
        if (Math.abs(x - cropX) <= handleSize && Math.abs(y - cropY) <= handleSize) return 'nw';
        if (Math.abs(x - (cropX + width)) <= handleSize && Math.abs(y - cropY) <= handleSize) return 'ne';
        if (Math.abs(x - cropX) <= handleSize && Math.abs(y - (cropY + height)) <= handleSize) return 'sw';
        if (Math.abs(x - (cropX + width)) <= handleSize && Math.abs(y - (cropY + height)) <= handleSize) return 'se';
        
        // Check sides (only if free form aspect ratio)
        const hasAspectRatio = (aspectRatios[currentAspectRatio] || aspectRatios['free']).ratio;
        if (!hasAspectRatio) {
            // Top side
            if (Math.abs(x - (cropX + width/2)) <= handleSize && Math.abs(y - cropY) <= handleSize) return 'n';
            // Right side  
            if (Math.abs(x - (cropX + width)) <= handleSize && Math.abs(y - (cropY + height/2)) <= handleSize) return 'e';
            // Bottom side
            if (Math.abs(x - (cropX + width/2)) <= handleSize && Math.abs(y - (cropY + height)) <= handleSize) return 's';
            // Left side
            if (Math.abs(x - cropX) <= handleSize && Math.abs(y - (cropY + height/2)) <= handleSize) return 'w';
        }
        
        // Check if inside crop area (for dragging entire crop)
        if (x >= cropX + handleSize && x <= cropX + width - handleSize && 
            y >= cropY + handleSize && y <= cropY + height - handleSize) {
            return 'move';
        }
        
        // Check if outside crop area for panning image
        if (x < cropX || x > cropX + width || y < cropY || y > cropY + height) {
            return 'pan';
        }
        
        return null;
    };

    const handleMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const handleType = getHandleType(x, y);
        
        if (handleType === 'move') {
            setIsDragging(true);
            setDragStart({ 
                x, y, 
                cropX: cropArea.x, 
                cropY: cropArea.y 
            });
        } else if (handleType === 'pan') {
            setIsPanningImage(true);
            setDragStart({ 
                x, y, 
                panX: imagePan.x, 
                panY: imagePan.y 
            });
        } else if (handleType && !['move', 'pan'].includes(handleType)) {
            setIsResizing(true);
            setResizeHandle(handleType);
            setDragStart({ 
                x, y, 
                cropX: cropArea.x, 
                cropY: cropArea.y,
                cropWidth: cropArea.width,
                cropHeight: cropArea.height
            });
        }
    };

    const handleMouseMove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (isDragging) {
            const deltaX = x - dragStart.x;
            const deltaY = y - dragStart.y;
            
            const newX = Math.max(0, Math.min(dragStart.cropX + deltaX, canvasSize.width - cropArea.width));
            const newY = Math.max(0, Math.min(dragStart.cropY + deltaY, canvasSize.height - cropArea.height));
            
            setCropArea(prev => ({ ...prev, x: newX, y: newY }));
        } else if (isPanningImage) {
            const deltaX = x - dragStart.x;
            const deltaY = y - dragStart.y;
            
            setImagePan({
                x: dragStart.panX + deltaX,
                y: dragStart.panY + deltaY
            });
        } else if (isResizing) {
            const deltaX = x - dragStart.x;
            const deltaY = y - dragStart.y;
            
            let newCropArea = { ...cropArea };
            const aspectRatio = (aspectRatios[currentAspectRatio] || aspectRatios['free']).ratio;
            
            switch (resizeHandle) {
                case 'se': // bottom-right
                    newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
                    if (aspectRatio) {
                        newCropArea.height = newCropArea.width / aspectRatio;
                    } else {
                        newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
                    }
                    break;
                case 'sw': // bottom-left
                    const newWidth = Math.max(50, dragStart.cropWidth - deltaX);
                    newCropArea.x = dragStart.cropX + (dragStart.cropWidth - newWidth);
                    newCropArea.width = newWidth;
                    if (aspectRatio) {
                        newCropArea.height = newWidth / aspectRatio;
                    } else {
                        newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
                    }
                    break;
                case 'ne': // top-right
                    newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
                    const newHeightNE = aspectRatio ? newCropArea.width / aspectRatio : Math.max(50, dragStart.cropHeight - deltaY);
                    newCropArea.y = dragStart.cropY + (dragStart.cropHeight - newHeightNE);
                    newCropArea.height = newHeightNE;
                    break;
                case 'nw': // top-left
                    const newWidthNW = Math.max(50, dragStart.cropWidth - deltaX);
                    const newHeightNW = aspectRatio ? newWidthNW / aspectRatio : Math.max(50, dragStart.cropHeight - deltaY);
                    newCropArea.x = dragStart.cropX + (dragStart.cropWidth - newWidthNW);
                    newCropArea.y = dragStart.cropY + (dragStart.cropHeight - newHeightNW);
                    newCropArea.width = newWidthNW;
                    newCropArea.height = newHeightNW;
                    break;
                // Side handles for free-form resizing
                case 'n': // top
                    const newHeightN = Math.max(50, dragStart.cropHeight - deltaY);
                    newCropArea.y = dragStart.cropY + (dragStart.cropHeight - newHeightN);
                    newCropArea.height = newHeightN;
                    break;
                case 's': // bottom
                    newCropArea.height = Math.max(50, dragStart.cropHeight + deltaY);
                    break;
                case 'e': // right
                    newCropArea.width = Math.max(50, dragStart.cropWidth + deltaX);
                    break;
                case 'w': // left
                    const newWidthW = Math.max(50, dragStart.cropWidth - deltaX);
                    newCropArea.x = dragStart.cropX + (dragStart.cropWidth - newWidthW);
                    newCropArea.width = newWidthW;
                    break;
            }
            
            // Ensure crop area stays within canvas bounds
            newCropArea.x = Math.max(0, Math.min(newCropArea.x, canvasSize.width - newCropArea.width));
            newCropArea.y = Math.max(0, Math.min(newCropArea.y, canvasSize.height - newCropArea.height));
            newCropArea.width = Math.min(newCropArea.width, canvasSize.width - newCropArea.x);
            newCropArea.height = Math.min(newCropArea.height, canvasSize.height - newCropArea.y);
            
            setCropArea(newCropArea);
        } else {
            // Update cursor based on hover position
            const handleType = getHandleType(x, y);
            let cursor = 'default';
            
            if (handleType === 'move') cursor = 'move';
            else if (handleType === 'pan') cursor = 'grab';
            else if (handleType === 'nw' || handleType === 'se') cursor = 'nw-resize';
            else if (handleType === 'ne' || handleType === 'sw') cursor = 'ne-resize';
            else if (handleType === 'n' || handleType === 's') cursor = 'ns-resize';
            else if (handleType === 'e' || handleType === 'w') cursor = 'ew-resize';
            
            canvas.style.cursor = cursor;
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setIsPanningImage(false);
        setResizeHandle('');
    };

    // Add wheel event handler for zooming
    const handleWheel = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setImageScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
    }, []);

    const handleAspectRatioChange = (newRatio) => {
        setCurrentAspectRatio(newRatio);
        const ratioConfig = aspectRatios[newRatio] || aspectRatios['free'];
        
        if (ratioConfig && ratioConfig.ratio) {
            // Adjust crop area to match new aspect ratio
            const newHeight = cropArea.width / ratioConfig.ratio;
            setCropArea(prev => ({
                ...prev,
                height: newHeight,
                y: Math.max(0, Math.min(prev.y, canvasSize.height - newHeight))
            }));
        }
    };

    const handleImageZoom = (delta) => {
        setImageScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
    };

    const handleResetImageTransform = () => {
        setImageScale(1);
        setImagePan({ x: 0, y: 0 });
    };

    const handleCrop = () => {
        const canvas = canvasRef.current;
        const img = imageRef.current;
        if (!canvas || !img) return;

        // Create crop canvas
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        cropCanvas.width = cropArea.width;
        cropCanvas.height = cropArea.height;

        // Calculate the relationship between canvas display and image scaling/panning
        const scaledWidth = canvasSize.width * imageScale;
        const scaledHeight = canvasSize.height * imageScale;
        const imageX = (canvasSize.width - scaledWidth) / 2 + imagePan.x;
        const imageY = (canvasSize.height - scaledHeight) / 2 + imagePan.y;

        // Calculate source coordinates in the original image
        const sourceScaleX = img.width / scaledWidth;
        const sourceScaleY = img.height / scaledHeight;
        
        const sourceX = (cropArea.x - imageX) * sourceScaleX;
        const sourceY = (cropArea.y - imageY) * sourceScaleY;
        const sourceWidth = cropArea.width * sourceScaleX;
        const sourceHeight = cropArea.height * sourceScaleY;

        // Ensure source coordinates are within image bounds
        const clampedSourceX = Math.max(0, Math.min(sourceX, img.width));
        const clampedSourceY = Math.max(0, Math.min(sourceY, img.height));
        const clampedSourceWidth = Math.min(sourceWidth, img.width - clampedSourceX);
        const clampedSourceHeight = Math.min(sourceHeight, img.height - clampedSourceY);

        // Draw cropped section
        if (clampedSourceWidth > 0 && clampedSourceHeight > 0) {
            cropCtx.drawImage(
                img,
                clampedSourceX, clampedSourceY, clampedSourceWidth, clampedSourceHeight,
                0, 0, cropArea.width, cropArea.height
            );
        }

        // Convert to blob and call onCrop
        cropCanvas.toBlob((blob) => {
            if (blob) {
                const croppedUrl = URL.createObjectURL(blob);
                console.log('🎯 ImageCropTool: Created cropped blob URL:', croppedUrl);
                onCrop(croppedUrl);
            } else {
                console.error('❌ ImageCropTool: Failed to create blob from canvas');
            }
        }, 'image/jpeg', 0.9);
    };

    if (isLoading) {
        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
                onClickCapture={(e) => e.stopPropagation()}
                style={{ pointerEvents: 'auto' }}
            >
                <div className="bg-white rounded-lg p-6 max-w-sm"
                     onClickCapture={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span>Loading image...</span>
                    </div>
                    <button 
                        onClick={onCancel}
                        className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]"
            onClickCapture={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
        >
            <div className="bg-white rounded-lg max-w-5xl max-h-[95vh] w-full mx-4 flex flex-col"
                 onClickCapture={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="text-lg font-semibold">Crop Image</h3>
                    <button 
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Canvas Container */}
                <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        className="border border-gray-300 cursor-crosshair"
                        style={{ 
                            width: canvasSize.width, 
                            height: canvasSize.height,
                            pointerEvents: 'auto'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    />
                </div>

                {/* Controls */}
                <div className="p-4 border-t bg-gray-50 space-y-3">
                    {/* Top Row - Image Controls */}
                    <div className="flex items-center justify-between">
                        {/* Image Zoom/Pan Controls */}
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium">Image:</span>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleImageZoom(-0.1);
                                    }}
                                    className="p-1 bg-white rounded border hover:bg-gray-50 transition-colors"
                                    title="Zoom Out"
                                >
                                    <span className="text-sm">🔍-</span>
                                </button>
                                <span className="text-xs w-12 text-center">{Math.round(imageScale * 100)}%</span>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleImageZoom(0.1);
                                    }}
                                    className="p-1 bg-white rounded border hover:bg-gray-50 transition-colors"
                                    title="Zoom In"
                                >
                                    <span className="text-sm">🔍+</span>
                                </button>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleResetImageTransform();
                                }}
                                className="px-2 py-1 bg-white rounded border text-xs hover:bg-gray-50 transition-colors"
                                title="Reset zoom and pan"
                            >
                                Reset
                            </button>
                        </div>

                        {/* Crop Info */}
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>Crop: {Math.round(cropArea.width)} × {Math.round(cropArea.height)}</span>
                            <span>Aspect: {(aspectRatios[currentAspectRatio] || aspectRatios['free']).label}</span>
                        </div>
                    </div>

                    {/* Bottom Row - Main Controls */}
                    <div className="flex items-center justify-between">
                        {/* Enhanced Aspect Ratio Selector */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">Aspect Ratio:</span>
                            <select
                                value={currentAspectRatio}
                                onChange={(e) => handleAspectRatioChange(e.target.value)}
                                className="text-sm border border-gray-300 rounded px-3 py-1 bg-white"
                            >
                                <optgroup label="📐 Flexible">
                                    {Object.entries(aspectRatios)
                                        .filter(([_, config]) => config.category === 'flexible')
                                        .map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                </optgroup>
                                <optgroup label="📱 Standard">
                                    {Object.entries(aspectRatios)
                                        .filter(([_, config]) => config.category === 'standard')
                                        .map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                </optgroup>
                                <optgroup label="🖥️ Widescreen">
                                    {Object.entries(aspectRatios)
                                        .filter(([_, config]) => config.category === 'wide')
                                        .map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                </optgroup>
                                <optgroup label="🎯 Banners">
                                    {Object.entries(aspectRatios)
                                        .filter(([_, config]) => config.category === 'banner')
                                        .map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                </optgroup>
                                <optgroup label="📲 Vertical">
                                    {Object.entries(aspectRatios)
                                        .filter(([_, config]) => config.category === 'vertical')
                                        .map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                </optgroup>
                            </select>
                        </div>

                        {/* Instructions */}
                        <div className="text-xs text-gray-500 max-w-md text-center">
                            Drag corners/sides to resize crop area • Click outside crop area to pan image • Use zoom controls for large images
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCrop}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex items-center space-x-2"
                            >
                                <span>✂️</span>
                                <span>Crop & Save</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- UTILITY COMPONENTS ---

// --- Page Components ---
const NewHomePage = ({teams, onTeamClick, leagueInfo, currentUser, websiteStyle, setCurrentUser, getAllNewsItems, setSelectedNewsItem, addTeamNewsItem, updateTeamNewsItem, deleteTeamNewsItem}) => {
    const sortedTeams = teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name));
    const isLeagueAdmin = currentUser && currentUser.roles.includes('admin');
    
    // State for editing modes
    const [editingNews, setEditingNews] = useState(false);
    const [editingPhotos, setEditingPhotos] = useState(false);
    const [editingVideos, setEditingVideos] = useState(false);
    const [editingNewsItem, setEditingNewsItem] = useState(null);
    






    
    // Helper function to handle YouTube URLs
    const handleVideoClick = (videoUrl) => {
        if (!videoUrl) return;
        
        // Handle different YouTube URL formats
        let finalUrl = videoUrl;
        if (videoUrl.includes('youtube.com/watch?v=') || videoUrl.includes('youtu.be/')) {
            finalUrl = videoUrl;
        } else if (videoUrl.includes('youtube.com/embed/')) {
            finalUrl = videoUrl.replace('/embed/', '/watch?v=');
        }
        
        window.open(finalUrl, '_blank');
    };

    // Mock picture/video content - will be made editable by admin
    const [mediaContent, setMediaContent] = useState({
        pictures: [
            { id: 1, title: "Championship Games", image: "https://placehold.co/400x250/dc2626/FFFFFF?text=Championship+Games", description: "The most exciting moments from our championship tournaments." },
            { id: 2, title: "Team Action Shots", image: "https://placehold.co/400x250/1d4ed8/FFFFFF?text=Action+Shots", description: "Dynamic gameplay photography showcasing player intensity." },
            { id: 3, title: "League Events", image: "https://placehold.co/400x250/047857/FFFFFF?text=League+Events", description: "Awards ceremonies and community gatherings." }
        ],
        videos: [
            { id: 1, title: "Season Highlights", thumbnail: "https://placehold.co/400x250/f59e0b/FFFFFF?text=Season+Highlights", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Best moments from the current season." },
            { id: 2, title: "Training Sessions", thumbnail: "https://placehold.co/400x250/be185d/FFFFFF?text=Training+Sessions", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", description: "Behind-the-scenes training footage." }
        ]
    });

    // News editing functions - for homepage, use first team or create a league news concept
    const handleAddNews = () => {
        const newItem = {
            id: Date.now(),
            type: 'text',
            text: "New announcement - edit this text",
            date: new Date().toISOString().split('T')[0]
        };
        // For homepage news, add to the first available team or create a special "league" entry
        const targetTeamId = teams.length > 0 ? teams[0].id : 'league';
        addTeamNewsItem(targetTeamId, newItem);
        setEditingNewsItem(newItem);
    };

    const handleSaveNews = (newsId, updatedItem) => {
        // Update news in the first team or league entry
        const targetTeamId = teams.length > 0 ? teams[0].id : 'league';
        updateTeamNewsItem(targetTeamId, newsId, updatedItem);
        setEditingNewsItem(null);
    };

    const handleDeleteNews = (newsId) => {
        // Delete from the first team or league entry
        const targetTeamId = teams.length > 0 ? teams[0].id : 'league';
        deleteTeamNewsItem(targetTeamId, newsId);
    };

    // Get news items for the homepage ticker
    const newsItems = getAllNewsItems();
    
    return (
        <div className="min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            {/* Enhanced Vertical Scrolling News Feed - Clean Background */}
            <div className="text-white py-2 relative" style={getBackgroundStyle(websiteStyle)}>
                <div className="flex items-start px-4 max-w-3xl mx-auto">
                    <span className="bg-red-800 text-white px-4 py-3 rounded text-sm font-bold mr-6 flex-shrink-0 shadow-lg">
                        {websiteStyle.newsLabel || 'NEWS'}
                    </span>
                    
                    {/* Vertical scrolling container with red background only for content */}
                    <div className="flex-grow overflow-hidden relative max-w-xl bg-red-800 rounded-lg shadow-lg" style={{ height: '280px' }}>
                        <div className="animate-scroll-vertical absolute w-full">
                            {/* Create a continuous loop by duplicating news items */}
                            {[...newsItems, ...newsItems].map((item, index) => (
                                <div 
                                    key={`${item.id}-${index}`} 
                                    className="relative flex items-center py-6 cursor-pointer hover:bg-red-700 hover:bg-opacity-50 rounded px-4 transition-colors group"
                                    style={{ height: '280px' }}
                                    onClick={() => setSelectedNewsItem(item)}
                                >
                                    {/* Admin Edit Button Overlay */}
                                    {currentUser && hasPermission(currentUser, 'system.admin_access') && index < newsItems.length && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingNewsItem(item);
                                                setEditingNews(true);
                                            }}
                                            className="absolute top-2 right-2 bg-blue-600 bg-opacity-80 hover:bg-opacity-100 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            title="Edit news item"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                    {item.type === 'image' && item.imageUrl && (
                                        <img 
                                            src={item.imageUrl} 
                                            alt="News"
                                            className="w-40 h-32 rounded mr-5 object-cover flex-shrink-0 shadow-sm"
                                        />
                                    )}
                                    {item.type === 'video' && item.thumbnailUrl && (
                                        <div className="relative mr-5 flex-shrink-0">
                                            <img 
                                                src={item.thumbnailUrl} 
                                                alt="Video"
                                                className="w-40 h-32 rounded object-cover shadow-sm"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                                                    <div className="w-0 h-0 border-l-6 border-l-red-600 border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-grow min-w-0">
                                        <div className="text-white font-semibold text-2xl truncate leading-tight">{item.heading || item.text}</div>
                                        {item.comments && (
                                            <div className="text-red-100 text-xl truncate mt-3 leading-relaxed">{item.comments}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Admin Controls - Positioned outside ticker for better visibility */}
            {currentUser && (
                <div className="bg-slate-700 text-white px-4 py-2 text-center">
                    <span className="text-sm">Logged in as: <strong>{currentUser.name}</strong> ({currentUser.roles.join(', ')})</span>
                </div>
            )}
            
            {isLeagueAdmin && (
                <div className="bg-blue-800 text-white px-4 py-3 flex items-center justify-center">
                    <button 
                        onClick={() => setEditingNews(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950 flex items-center"
                        title="Edit news ticker"
                    >
                        <Edit className="mr-2 h-4 w-4"/> Edit News Ticker
                    </button>
                    <span className="mx-4 text-blue-200">|</span>
                    <button 
                        onClick={() => setEditingPhotos(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950 flex items-center"
                        title="Edit photo gallery"
                    >
                        <Edit className="mr-2 h-4 w-4"/> Edit Photos
                    </button>
                    <span className="mx-4 text-blue-200">|</span>
                    <button 
                        onClick={() => setEditingVideos(true)}
                        className="bg-blue-900 text-white px-4 py-2 rounded hover:bg-blue-950 flex items-center"
                        title="Edit video gallery"
                    >
                        <Edit className="mr-2 h-4 w-4"/> Edit Videos
                    </button>
                </div>
            )}

            {/* News Editing Modal */}
            {editingNews && isLeagueAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setEditingNews(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit News Ticker</h3>
                            <button 
                                onClick={() => setEditingNews(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                            {newsItems.map(item => (
                                <div key={item.id} className="bg-slate-50 p-3 rounded">
                                    {editingNewsItem?.id === item.id ? (
                                        <div className="space-y-2">
                                            <div className="space-y-3">
                                                {/* News Type Selector */}
                                                <select 
                                                    defaultValue={item.type}
                                                    className="p-2 border rounded w-full"
                                                    onChange={(e) => {
                                                        setEditingNewsItem(prev => ({...prev, type: e.target.value}));
                                                    }}
                                                >
                                                    <option value="text">📝 Text Only</option>
                                                    <option value="image">🖼️ Image + Text</option>
                                                    <option value="video">🎥 Video + Text</option>
                                                </select>
                                                
                                                {/* Header Text */}
                                                <input 
                                                    type="text"
                                                    defaultValue={item.heading}
                                                    placeholder="News headline/header (e.g., 'Championship Victory')"
                                                    className="p-2 border rounded w-full font-medium"
                                                    onChange={(e) => {
                                                        setEditingNewsItem(prev => ({...prev, heading: e.target.value}));
                                                    }}
                                                />
                                                
                                                {/* Body Text */}
                                                <textarea 
                                                    defaultValue={item.text}
                                                    placeholder="Detailed news content (e.g., 'The team secured a decisive 15-10 victory...')"
                                                    className="p-2 border rounded w-full h-24 resize-vertical"
                                                    onChange={(e) => {
                                                        setEditingNewsItem(prev => ({...prev, text: e.target.value}));
                                                    }}
                                                />
                                                
                                                {/* Comments/Additional Info */}
                                                <input 
                                                    type="text"
                                                    defaultValue={item.comments}
                                                    placeholder="Additional comments or context (optional)"
                                                    className="p-2 border rounded w-full text-sm"
                                                    onChange={(e) => {
                                                        setEditingNewsItem(prev => ({...prev, comments: e.target.value}));
                                                    }}
                                                />
                                            </div>
                                            
                                            {editingNewsItem?.type === 'image' && (
                                                <FileUploadInput
                                                    label="News Image"
                                                    accept="image/*"
                                                    currentValue={editingNewsItem.imageUrl || ''}
                                                    onChange={(url) => {
                                                        setEditingNewsItem(prev => ({...prev, imageUrl: url}));
                                                    }}
                                                    placeholder="Upload image or paste URL"
                                                    enableCrop={false}
                                                    cropAspectRatio="16:9"
                                                />
                                            )}
                                            
                                            {editingNewsItem?.type === 'video' && (
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block font-semibold text-slate-700 mb-1">Video URL (YouTube, etc.)</label>
                                                        <input 
                                                            type="url"
                                                            defaultValue={editingNewsItem.videoUrl || ''}
                                                            placeholder="https://www.youtube.com/watch?v=..."
                                                            className="w-full p-2 border rounded"
                                                            onChange={(e) => {
                                                                setEditingNewsItem(prev => ({...prev, videoUrl: e.target.value}));
                                                            }}
                                                        />
                                                    </div>
                                                    <FileUploadInput
                                                        label="Video Thumbnail"
                                                        accept="image/*"
                                                        currentValue={editingNewsItem.thumbnailUrl || ''}
                                                        onChange={(url) => {
                                                            setEditingNewsItem(prev => ({...prev, thumbnailUrl: url}));
                                                        }}
                                                        placeholder="Upload thumbnail image"
                                                        enableCrop={false}
                                                        cropAspectRatio="16:9"
                                                    />
                                                </div>
                                            )}
                                            
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleSaveNews(item.id, editingNewsItem)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    onClick={() => setEditingNewsItem(null)}
                                                    className="bg-slate-500 text-white px-3 py-1 rounded text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-2 flex-grow">
                                                {item.type === 'image' && item.imageUrl && (
                                                    <img src={item.imageUrl} alt="News" className="w-8 h-6 rounded object-cover"/>
                                                )}
                                                {item.type === 'video' && item.thumbnailUrl && (
                                                    <div className="relative">
                                                        <img src={item.thumbnailUrl} alt="Video" className="w-8 h-6 rounded object-cover"/>
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <div className="w-2 h-2 bg-white rounded-full"></div>
                                                        </div>
                                                    </div>
                                                )}
                                                <div>
                                                    <span className="flex-grow font-semibold">{item.text}</span>
                                                    <span className="text-xs text-slate-500 ml-2">({item.type})</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => setEditingNewsItem(item)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                >
                                                    <Edit className="h-4 w-4"/>
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteNews(item.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={handleAddNews}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add News Item
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 md:p-8">
                {/* Teams of MLBL Section */}
                <div className="mb-12">
                    <div className="text-center mb-8">
                        <h1 className="text-5xl font-bold text-slate-800 mb-2 tracking-tight">{leagueInfo.name || "Men's Lacrosse Beer League"}</h1>
                        <h2 className="text-3xl font-bold text-slate-600 mb-6 tracking-tight">Our Teams</h2>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-4">
                        {sortedTeams.map(team => (
                            <button
                                key={team.id}
                                onClick={() => onTeamClick(team.id)}
                                className="group bg-white rounded-xl shadow-lg p-2 md:p-4 hover:shadow-xl transform transition-all duration-300 hover:scale-105 relative overflow-hidden"
                                style={{
                                    backgroundColor: team.style?.backgroundColor || '#ffffff',
                                    borderLeft: `6px solid ${team.style?.primaryColor || '#dc2626'}`
                                }}
                            >
                                {/* Team Logo - Compact Mobile Rectangle */}
                                <div className="h-12 sm:h-16 md:h-24 mb-1 md:mb-2 rounded-lg overflow-hidden relative" style={{
                                    backgroundColor: team.style?.primaryColor || '#dc2626',
                                    backgroundImage: `linear-gradient(45deg, ${team.style?.primaryColor || '#dc2626'} 0%, ${team.style?.backgroundColor || '#ffffff'} 100%)`
                                }}>
                                    <img 
                                        src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} 
                                        alt={team.name} 
                                        className={`w-full h-full group-hover:scale-110 transition-transform ${getLogoStyle(websiteStyle)} opacity-90`}
                                    />
                                    {/* Overlay for better contrast */}
                                    <div className="absolute inset-0 bg-black bg-opacity-10"></div>
                                </div>
                                
                                {/* Team Name and Division - Compact mobile */}
                                <h3 className="text-xs sm:text-sm md:text-lg font-bold text-slate-800 mb-1 group-hover:text-opacity-80 transition-all text-center leading-tight">
                                    {team.name}
                                </h3>
                                <p className="text-xs md:text-sm text-slate-500 mb-1 md:mb-4 text-center flex items-center justify-center">
                                    {team.division === 'Field' ? (
                                        <><Trophy size={10} className="mr-1" /> Field</>
                                    ) : (
                                        <><Shield size={10} className="mr-1" /> Box</>
                                    )}
                                </p>
                                
                                {/* W/L Record - Compact mobile layout */}
                                <div className="flex justify-center space-x-2 sm:space-x-3 md:space-x-6 mb-2 md:mb-4">
                                    <div className="text-center">
                                        <div className="text-xs font-semibold text-slate-500 mb-1">W</div>
                                        <div className="text-base sm:text-lg md:text-2xl font-bold text-green-600">{team.wins}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs font-semibold text-slate-500 mb-1">L</div>
                                        <div className="text-base sm:text-lg md:text-2xl font-bold text-red-600">{team.losses}</div>
                                    </div>
                                </div>
                                
                                {/* Hover Action */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div 
                                        className="text-sm font-semibold text-center py-2 rounded-lg"
                                        style={{ 
                                            backgroundColor: team.style?.primaryColor || '#dc2626',
                                            color: 'white'
                                        }}
                                    >
                                        View Team →
                                    </div>
                                </div>
                                
                                {/* Decorative gradient overlay */}
                                <div 
                                    className="absolute top-0 right-0 w-16 h-16 opacity-10"
                                    style={{
                                        background: `linear-gradient(135deg, ${team.style?.primaryColor || '#dc2626'} 0%, transparent 70%)`
                                    }}
                                ></div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Picture and Video Windows */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    {/* Picture Window */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Photo Gallery</h3>
                            {isLeagueAdmin && (
                                <button 
                                    onClick={() => setEditingPhotos(true)}
                                    className="bg-red-800 text-white px-3 py-2 rounded text-sm hover:bg-red-900 flex items-center"
                                    title="Edit photos"
                                >
                                    <Edit className="mr-1 h-4 w-4"/> Edit Photos
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {mediaContent.pictures.map(picture => (
                                <div key={picture.id} 
                                     className="relative bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer group"
                                     onClick={() => {
                                         // Open a simple image viewer or placeholder
                                         window.open(picture.image, '_blank');
                                     }}
                                >
                                    {/* Admin Edit Button Overlay */}
                                    {isLeagueAdmin && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingPhotos(true);
                                            }}
                                            className="absolute top-2 right-2 bg-blue-600 bg-opacity-80 hover:bg-opacity-100 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            title="Edit photo gallery"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                    <div className="flex items-center space-x-4">
                                        <img 
                                            src={picture.image} 
                                            alt={picture.title}
                                            className="w-16 h-16 rounded-lg object-cover"
                                        />
                                        <div className="flex-grow">
                                            <h4 className="font-semibold text-slate-800">{picture.title}</h4>
                                            <p className="text-sm text-slate-600">{picture.description}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.open(picture.image, '_blank');
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                        >
                                            View →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Video Window */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-slate-800">Video Gallery</h3>
                            {isLeagueAdmin && (
                                <button 
                                    onClick={() => setEditingVideos(true)}
                                    className="bg-red-800 text-white px-3 py-2 rounded text-sm hover:bg-red-900 flex items-center"
                                    title="Edit videos"
                                >
                                    <Edit className="mr-1 h-4 w-4"/> Edit Videos
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {mediaContent.videos.map(video => (
                                <div key={video.id} 
                                     className="relative bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors cursor-pointer group"
                                     onClick={() => {
                                         handleVideoClick(video.url);
                                     }}
                                >
                                    {/* Admin Edit Button Overlay */}
                                    {isLeagueAdmin && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingVideos(true);
                                            }}
                                            className="absolute top-2 right-2 bg-blue-600 bg-opacity-80 hover:bg-opacity-100 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                            title="Edit video gallery"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    )}
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <img 
                                                src={video.thumbnail} 
                                                alt={video.title}
                                                className="w-16 h-16 rounded-lg object-cover"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-lg">
                                                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                                    <div className="w-0 h-0 border-l-4 border-l-red-600 border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="font-semibold text-slate-800">{video.title}</h4>
                                            <p className="text-sm text-slate-600">{video.description}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVideoClick(video.url);
                                            }}
                                            className="text-red-600 hover:text-red-800 text-sm font-semibold"
                                        >
                                            Watch →
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Admin Quick Access */}
                {isLeagueAdmin && (
                    <div className="text-center">
                        <button 
                            onClick={() => window.location.hash = 'admin-portal'}
                            className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 flex items-center mx-auto"
                        >
                            <Settings className="mr-2 h-5 w-5"/> League Management
                        </button>
                    </div>
                )}

            {/* Photo Editing Modal */}
            {editingPhotos && isLeagueAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setEditingPhotos(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Photo Gallery</h3>
                            <button 
                                onClick={() => setEditingPhotos(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                            {mediaContent.pictures.map(picture => (
                                <div key={picture.id} className="bg-slate-50 p-4 rounded border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <img src={picture.image} alt={picture.title} className="w-full h-32 object-cover rounded"/>
                                        </div>
                                        <div className="space-y-2">
                                            <input 
                                                type="text"
                                                defaultValue={picture.title}
                                                placeholder="Photo title"
                                                className="w-full p-2 border rounded"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.map(p => 
                                                            p.id === picture.id ? {...p, title: e.target.value} : p
                                                        )
                                                    }));
                                                }}
                                            />
                                            <FileUploadInput
                                                label="Photo Image"
                                                accept="image/*"
                                                currentValue={picture.image}
                                                onChange={(url) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.map(p => 
                                                            p.id === picture.id ? {...p, image: url} : p
                                                        )
                                                    }));
                                                }}
                                                placeholder="Upload photo or paste URL"
                                                enableCrop={false}
                                                cropAspectRatio="free"
                                            />
                                            <textarea 
                                                defaultValue={picture.description}
                                                placeholder="Photo description"
                                                className="w-full p-2 border rounded h-20"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.map(p => 
                                                            p.id === picture.id ? {...p, description: e.target.value} : p
                                                        )
                                                    }));
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        pictures: prev.pictures.filter(p => p.id !== picture.id)
                                                    }));
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Delete Photo
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => {
                                const newPhoto = {
                                    id: Date.now(),
                                    title: "New Photo",
                                    image: "https://placehold.co/400x250/94a3b8/FFFFFF?text=New+Photo",
                                    description: "Add description here"
                                };
                                setMediaContent(prev => ({
                                    ...prev,
                                    pictures: [...prev.pictures, newPhoto]
                                }));
                            }}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add Photo
                        </button>
                    </div>
                </div>
            )}

            {/* Video Editing Modal */}
            {editingVideos && isLeagueAdmin && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    onClick={() => setEditingVideos(false)}
                >
                    <div 
                        className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Edit Video Gallery</h3>
                            <button 
                                onClick={() => setEditingVideos(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <div className="space-y-4 mb-4">
                            {mediaContent.videos.map(video => (
                                <div key={video.id} className="bg-slate-50 p-4 rounded border">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <img src={video.thumbnail} alt={video.title} className="w-full h-32 object-cover rounded"/>
                                        </div>
                                        <div className="space-y-2">
                                            <input 
                                                type="text"
                                                defaultValue={video.title}
                                                placeholder="Video title"
                                                className="w-full p-2 border rounded"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.map(v => 
                                                            v.id === video.id ? {...v, title: e.target.value} : v
                                                        )
                                                    }));
                                                }}
                                            />
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1">Video URL</label>
                                                <input 
                                                    type="url"
                                                    defaultValue={video.url}
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                    className="w-full p-2 border rounded"
                                                    onChange={(e) => {
                                                        setMediaContent(prev => ({
                                                            ...prev,
                                                            videos: prev.videos.map(v => 
                                                                v.id === video.id ? {...v, url: e.target.value} : v
                                                            )
                                                        }));
                                                    }}
                                                />
                                            </div>
                                            <FileUploadInput
                                                label="Video Thumbnail"
                                                accept="image/*"
                                                currentValue={video.thumbnail}
                                                onChange={(url) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.map(v => 
                                                            v.id === video.id ? {...v, thumbnail: url} : v
                                                        )
                                                    }));
                                                }}
                                                placeholder="Upload thumbnail image"
                                                enableCrop={false}
                                                cropAspectRatio="16:9"
                                            />
                                            <textarea 
                                                defaultValue={video.description}
                                                placeholder="Video description"
                                                className="w-full p-2 border rounded h-20"
                                                onChange={(e) => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.map(v => 
                                                            v.id === video.id ? {...v, description: e.target.value} : v
                                                        )
                                                    }));
                                                }}
                                            />
                                            <button 
                                                onClick={() => {
                                                    setMediaContent(prev => ({
                                                        ...prev,
                                                        videos: prev.videos.filter(v => v.id !== video.id)
                                                    }));
                                                }}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                            >
                                                Delete Video
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => {
                                const newVideo = {
                                    id: Date.now(),
                                    title: "New Video",
                                    thumbnail: "https://placehold.co/400x250/be185d/FFFFFF?text=New+Video",
                                    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
                                    description: "Add description here"
                                };
                                setMediaContent(prev => ({
                                    ...prev,
                                    videos: [...prev.videos, newVideo]
                                }));
                            }}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add Video
                        </button>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
};

const HomePage = ({teams, onTeamClick, leagueInfo, websiteStyle}) => {
    const sortedTeams = teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name));
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            {/* Hero Section */}
            <div className="text-center mb-12">
                <h1 className="text-6xl font-bold text-slate-800 mb-4 tracking-tight">{leagueInfo.name}</h1>
                <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    {leagueInfo.description || "Welcome to the premier lacrosse league featuring competitive teams from across the region. Experience the excitement, skill, and camaraderie that makes our league special."}
                </p>
            </div>

            {/* Photo Albums Section */}
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-slate-800 mb-8 text-center tracking-tight">League Photo Gallery</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <img src="https://placehold.co/400x250/dc2626/FFFFFF?text=Championship+Games" alt="Championship" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Championship Games</h3>
                            <p className="text-slate-600">The most exciting moments from our championship tournaments and playoff games.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <img src="https://placehold.co/400x250/1d4ed8/FFFFFF?text=Team+Action+Shots" alt="Action" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Action Shots</h3>
                            <p className="text-slate-600">Dynamic gameplay photography showcasing the intensity and skill of our players.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                        <img src="https://placehold.co/400x250/047857/FFFFFF?text=League+Events" alt="Events" className="w-full h-48 object-cover" />
                        <div className="p-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">League Events</h3>
                            <p className="text-slate-600">Behind-the-scenes moments, awards ceremonies, and community gatherings.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Teams Grid */}
            <div className="mb-12">
                <h2 className="text-4xl font-bold text-slate-800 mb-8 text-center tracking-tight">Our Teams</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {sortedTeams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => onTeamClick(team.id)}
                            className="group bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transform transition-all duration-300 hover:scale-105 text-center"
                        >
                            <div className="relative mb-4">
                                <img 
                                    src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} 
                                    alt={team.name} 
                                    className="w-20 h-20 mx-auto rounded-full bg-slate-200 p-2 group-hover:scale-110 transition-transform"
                                />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-red-700 transition-colors">
                                {team.name}
                            </h3>
                            <div className="flex justify-center space-x-4 text-sm">
                                <div className="text-center">
                                    <div className="font-bold text-green-600">{team.wins}</div>
                                    <div className="text-slate-500">Wins</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-red-600">{team.losses}</div>
                                    <div className="text-slate-500">Losses</div>
                                </div>
                            </div>
                            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-sm text-red-600 font-semibold">View Team →</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* About Section */}
            <div className="bg-slate-50 rounded-xl p-8 text-center">
                <h2 className="text-3xl font-bold text-slate-800 mb-4">About Our League</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="text-4xl font-bold text-red-600 mb-2">{teams.filter(t => t.active).length}</div>
                        <div className="text-slate-600">Active Teams</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-red-600 mb-2">{leagueInfo.founded || "2020"}</div>
                        <div className="text-slate-600">Founded</div>
                    </div>
                    <div>
                        <div className="text-4xl font-bold text-red-600 mb-2">{leagueInfo.location || "Ohio Valley"}</div>
                        <div className="text-slate-600">Region</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EventsPage = ({teams, leagueSchedule, onTeamClick, currentUser, websiteStyle, onUpdateRSVP, users, onSendNotification}) => {
    const [selectedTeamSchedule, setSelectedTeamSchedule] = useState('all');
    const [eventTypeFilters, setEventTypeFilters] = useState({
        game: true,
        practice: true,
        tournament: true,
        meeting: true,
        social: true,
        other: true
    });
    
    const getTeam = (id) => teams.find(t => t.id === id);
    const isAdmin = currentUser && currentUser.roles.includes('admin');
    
    // Get all calendar events from all teams
    const allEvents = teams.flatMap(team => 
        (team.calendar || []).map(event => ({
            ...event,
            teamName: team.name,
            teamLogo: team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team',
            teamId: team.id
        }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter events by team and type
    const filteredEvents = allEvents
        .filter(event => selectedTeamSchedule === 'all' || event.teamId === selectedTeamSchedule)
        .filter(event => eventTypeFilters[event.type || 'other']);
    
    // Memoized handler for event type filter changes
    const handleEventTypeToggle = useCallback((eventType) => {
        setEventTypeFilters(prev => ({
            ...prev,
            [eventType]: !prev[eventType]
        }));
    }, []);
    
    // Get unique event types from all events
    const availableEventTypes = useMemo(() => {
        const types = new Set(allEvents.map(event => event.type || 'other'));
        return Array.from(types).sort();
    }, [allEvents]);
    
    // Group tournament events by title, date, and location
    const groupedEvents = filteredEvents.reduce((groups, event) => {
        if (event.type === 'tournament') {
            const key = `${event.title}-${event.date}-${event.location}`;
            if (!groups[key]) {
                groups[key] = {
                    ...event,
                    teams: [],
                    teamIds: []
                };
            }
            groups[key].teams.push({ name: event.teamName, logo: event.teamLogo, id: event.teamId });
            groups[key].teamIds.push(event.teamId);
        }
        return groups;
    }, {});

    // Create display events (individual events + tournament summaries)
    const displayEvents = [];
    const processedTournamentKeys = new Set();

    filteredEvents.forEach(event => {
        if (event.type === 'tournament') {
            const key = `${event.title}-${event.date}-${event.location}`;
            if (!processedTournamentKeys.has(key)) {
                displayEvents.push(groupedEvents[key]);
                processedTournamentKeys.add(key);
            }
        } else {
            displayEvents.push(event);
        }
    });

    // Filter schedule
    const filteredSchedule = leagueSchedule.map(day => {
        if (selectedTeamSchedule === 'all') return day;
        const games = day.games.filter(g => g.home === selectedTeamSchedule || g.away === selectedTeamSchedule);
        return { ...day, games };
    }).filter(day => day.games.length > 0);
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">League Events & Schedule</h1>
                <div className="flex space-x-2">
                    {(isAdmin || hasPermission(currentUser, 'events.view')) && (
                        <button 
                            onClick={() => window.location.hash = 'event-dashboard'}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center text-sm"
                            title="View event management dashboard"
                        >
                            <BarChart2 className="mr-2 h-4 w-4"/> Event Dashboard
                        </button>
                    )}
                    {isAdmin && (
                        <button 
                            onClick={() => {
                                // Navigate to admin portal and set default tab to calendar
                                window.localStorage.setItem('admin_default_tab', 'calendar');
                                window.location.hash = 'admin-portal';
                            }}
                            className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center text-sm"
                            title="Quick access to calendar management"
                        >
                            <Plus className="mr-2 h-4 w-4"/> Add League Event
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mb-6 space-y-4">
                {/* Team Filter */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Filter by Team</label>
                    <select 
                        onChange={(e) => setSelectedTeamSchedule(e.target.value)} 
                        value={selectedTeamSchedule} 
                        className="p-3 border border-slate-300 rounded-md shadow-sm"
                    >
                        <option value="all">All Teams</option>
                        {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => 
                            <option key={team.id} value={team.id}>{team.name}</option>
                        )}
                    </select>
                </div>

                {/* Event Type Filters */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Show/Hide Event Types</label>
                    <div className="flex flex-wrap gap-3">
                        {availableEventTypes.map(eventType => {
                            const isEnabled = eventTypeFilters[eventType];
                            const eventTypeColors = {
                                game: 'bg-red-100 text-red-800 border-red-200',
                                practice: 'bg-blue-100 text-blue-800 border-blue-200',
                                tournament: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                meeting: 'bg-purple-100 text-purple-800 border-purple-200',
                                social: 'bg-green-100 text-green-800 border-green-200',
                                other: 'bg-slate-100 text-slate-800 border-slate-200'
                            };
                            
                            return (
                                <button
                                    key={eventType}
                                    onClick={() => handleEventTypeToggle(eventType)}
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                                        isEnabled 
                                            ? eventTypeColors[eventType] || eventTypeColors.other
                                            : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
                                    }`}
                                    title={`${isEnabled ? 'Hide' : 'Show'} ${eventType} events`}
                                >
                                    {isEnabled ? '✓' : '✗'} {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                                </button>
                            );
                        })}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                        Click to show/hide event types. Showing {Object.values(eventTypeFilters).filter(Boolean).length} of {availableEventTypes.length} event types.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upcoming Events */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Calendar className="mr-2" size={24} />
                        Upcoming Events
                    </h2>
                    <div className="space-y-4">
                        {displayEvents.length > 0 ? displayEvents.slice(0, 10).map(event => {
                            if (event.teams) {
                                // Tournament summary card
                                return (
                                    <div key={`tournament-${event.title}-${event.date}`} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Trophy className="text-yellow-600" size={18} />
                                                    <h3 className="font-bold text-slate-800 text-lg">{event.title}</h3>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
                                                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                                    <span>{event.time}</span>
                                                    {event.location && (
                                                        <ClickableLocation 
                                                            locationName={event.location}
                                                            teams={teams}
                                                        />
                                                    )}
                                                </div>
                                                {event.imageUrl && (
                                                    <img src={event.imageUrl} alt="Tournament" className="w-full h-32 object-cover rounded-lg mb-3" />
                                                )}
                                                <div className="mb-2">
                                                    <span className="text-sm font-semibold text-slate-700">Participating Teams ({event.teams.length}):</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {event.teams.sort((a, b) => a.name.localeCompare(b.name)).map((team, index) => (
                                                        <button
                                                            key={`${team.id}-${index}`}
                                                            onClick={() => onTeamClick(team.id)}
                                                            className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs hover:shadow-md transition-shadow"
                                                        >
                                                            <img src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} alt={team.name} className="w-4 h-4 rounded-full" />
                                                            <span className="text-slate-700">{team.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                {event.description && (
                                                    <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                                                )}
                                            </div>
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                TOURNAMENT
                                            </span>
                                        </div>
                                    </div>
                                );
                            } else {
                                // Regular event card
                                return (
                                    <div key={`${event.teamId}-${event.id}`} className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-grow">
                                                <button onClick={() => onTeamClick(event.teamId)} className="flex items-center gap-2 mb-2 hover:opacity-80">
                                                    <img src={event.teamLogo} alt={event.teamName} className="w-6 h-6 rounded-full object-contain" />
                                                    <span className="font-semibold text-red-700">{event.teamName}</span>
                                                </button>
                                                <h3 className="font-bold text-slate-800 mb-1">{event.title}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-slate-600 mb-2">
                                                    <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}</span>
                                                    <span>{event.time}</span>
                                                    {event.location && (
                                                        <ClickableLocation 
                                                            locationName={event.location}
                                                            teams={teams}
                                                        />
                                                    )}
                                                </div>
                                                {event.imageUrl && (
                                                    <img src={event.imageUrl} alt="Event" className="w-full h-32 object-cover rounded-lg mb-3" />
                                                )}
                                                {event.description && (
                                                    <p className="text-sm text-slate-600 mb-3">{event.description}</p>
                                                )}
                                                
                                                {/* RSVP Component */}
                                                <RSVPManager 
                                                    event={event}
                                                    currentUser={currentUser}
                                                    onUpdateRSVP={onUpdateRSVP}
                                                    users={users}
                                                />
                                                
                                                {/* Notification Controls for Admins/Coaches */}
                                                {currentUser && (hasPermission(currentUser, 'events.edit') || event.teamId === currentUser.teamId) && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <div className="flex space-x-2">
                                                            <button 
                                                                onClick={() => onSendNotification(event, 'reminder')}
                                                                className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                                                                title="Send event reminder to all team members"
                                                            >
                                                                📧 Send Reminder
                                                            </button>
                                                            <button 
                                                                onClick={() => onSendNotification(event, 'rsvp_request')}
                                                                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition-colors"
                                                                title="Request RSVP responses"
                                                            >
                                                                📲 Request RSVP
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                event.type === 'tournament' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-slate-100 text-slate-800'
                                            }`}>
                                                {event.type}
                                            </span>
                                        </div>
                                    </div>
                                );
                            }
                        }) : (
                            <div className="text-center py-8 text-slate-500">
                                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                <p>No upcoming events found.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Past Events */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                        <Swords className="mr-2" size={24} />
                        Past Events
                    </h2>
                    <div className="space-y-6">
                        {filteredSchedule.map(day => (
                            <div key={day.date}>
                                <h3 className="text-lg font-semibold text-slate-700 pb-2 border-b-2 border-red-800 mb-3">
                                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </h3>
                                <div className="space-y-3">
                                    {day.games.map((game) => {
                                        const home = getTeam(game.home);
                                        const away = getTeam(game.away);
                                        if (!home || !away) return null;
                                        return (
                                            <div key={game.id} className="bg-white p-4 rounded-lg shadow-md flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <button onClick={() => onTeamClick(away.id)} className="text-center w-28 hover:opacity-80">
                                                        <img src={away.logo} alt={away.name} className="w-12 h-12 mx-auto rounded-full bg-slate-200 p-1 object-contain"/>
                                                        <p className="font-bold text-xs mt-1">{away.name}</p>
                                                    </button>
                                                    <span className="text-xl font-bold text-slate-400 mx-3">@</span>
                                                    <button onClick={() => onTeamClick(home.id)} className="text-center w-28 hover:opacity-80">
                                                        <img src={home.logo} alt={home.name} className="w-12 h-12 mx-auto rounded-full bg-slate-200 p-1 object-contain"/>
                                                        <p className="font-bold text-xs mt-1">{home.name}</p>
                                                    </button>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold">{game.time}</p>
                                                    <p className="text-sm text-slate-500">{game.location}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LeagueContactPage = ({ websiteStyle, leagueInfo }) => (
    <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
        <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
                <img src={websiteStyle.logoUrl} alt="MLBL Logo" className="h-40 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-slate-800 tracking-tight">{leagueInfo.name}</h1>
            </div>
            <ContactCard entity={leagueInfo} />
        </div>
    </div>
);

const StandingsPage = ({teams, onTeamClick, websiteStyle}) => {
    const fieldTeams = teams.filter(t => t.active && t.division === 'Field').sort((a, b) => {
        const scoreA = a.wins * 2 + a.ties;
        const scoreB = b.wins * 2 + b.ties;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.pf - b.pa) - (a.pf - a.pa);
    });
    
    const boxTeams = teams.filter(t => t.active && t.division === 'Box').sort((a, b) => {
        const scoreA = a.wins * 2 + a.ties;
        const scoreB = b.wins * 2 + b.ties;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return (b.pf - b.pa) - (a.pf - a.pa);
    });

    const renderStandingsTable = (divisionTeams, divisionName) => (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-700 mb-4 flex items-center">
                {divisionName === 'Field' ? <Trophy className="mr-2" size={24} /> : <Shield className="mr-2" size={24} />}
                {divisionName} Lacrosse Standings
            </h2>
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full table-auto">
                    <thead className="bg-slate-100 text-slate-600 uppercase text-sm leading-normal">
                        <tr>
                            <th className="py-3 px-6 text-left">Team</th>
                            <th className="py-3 px-6 text-center">W</th><th className="py-3 px-6 text-center">L</th><th className="py-3 px-6 text-center">T</th>
                            <th className="py-3 px-6 text-center">PF</th><th className="py-3 px-6 text-center">PA</th><th className="py-3 px-6 text-center">DIFF</th>
                            <th className="py-3 px-6 text-center">Score</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm font-light">
                        {divisionTeams.map((team, index) => {
                            const differential = team.pf - team.pa;
                            const score = team.wins * 2 + team.ties;
                            return (
                                <tr key={team.id} className={`border-b border-slate-200 hover:bg-slate-50 ${index === 0 ? 'bg-yellow-50' : ''}`}>
                                    <td className="py-3 px-6 text-left whitespace-nowrap">
                                        <button onClick={() => onTeamClick(team.id)} className="flex items-center hover:opacity-80">
                                            {index === 0 && <Crown size={16} className="text-yellow-600 mr-1" />}
                                            <img src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} alt={team.name} className="w-8 h-8 mr-3 rounded-full bg-white p-1 object-contain" />
                                            <span className="font-medium">{team.name}</span>
                                        </button>
                                    </td>
                                    <td className="py-3 px-6 text-center">{team.wins}</td><td className="py-3 px-6 text-center">{team.losses}</td><td className="py-3 px-6 text-center">{team.ties}</td>
                                    <td className="py-3 px-6 text-center text-green-600 font-semibold">{team.pf}</td><td className="py-3 px-6 text-center text-red-600 font-semibold">{team.pa}</td>
                                    <td className={`py-3 px-6 text-center font-semibold ${differential > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {differential > 0 ? `+${differential}` : differential}
                                    </td>
                                    <td className="py-3 px-6 text-center font-bold text-red-800">{score}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <h1 className="text-4xl font-bold text-slate-800 mb-6 tracking-tight">League Standings</h1>
            {fieldTeams.length > 0 && renderStandingsTable(fieldTeams, 'Field')}
            {boxTeams.length > 0 && renderStandingsTable(boxTeams, 'Box')}
        </div>
    );
};

const LeagueCalendarManager = ({ teams, setTeams, websiteStyle }) => {
    const [selectedTeamId, setSelectedTeamId] = useState('all');
    const [editingEvent, setEditingEvent] = useState(null);

    // Get form background color from website style or default
    const formBackgroundColor = websiteStyle?.formBackgroundColor || '#f8fafc';

    const selectedTeam = teams.find(t => t.id === selectedTeamId);
    const events = selectedTeamId === 'all' 
        ? teams.flatMap(team => (team.calendar || []).map(event => ({...event, teamName: team.name, teamId: team.id})))
        : selectedTeam?.calendar || [];

    const handleSave = (e) => {
        e.preventDefault();
        
        // Helper function to generate recurring events
        const generateRecurringEvents = (baseEvent) => {
            if (!baseEvent.repeatType || baseEvent.repeatType === 'none' || !baseEvent.repeatCount) {
                return [baseEvent];
            }
            
            const events = [];
            const startDate = new Date(baseEvent.date);
            
            for (let i = 0; i < baseEvent.repeatCount; i++) {
                const eventDate = new Date(startDate);
                
                switch (baseEvent.repeatType) {
                    case 'daily':
                        eventDate.setDate(startDate.getDate() + i);
                        break;
                    case 'weekly':
                        eventDate.setDate(startDate.getDate() + (i * 7));
                        break;
                    case 'biweekly':
                        eventDate.setDate(startDate.getDate() + (i * 14));
                        break;
                    case 'monthly':
                        eventDate.setMonth(startDate.getMonth() + i);
                        break;
                }
                
                const event = {
                    ...baseEvent,
                    id: (baseEvent.id || Date.now()) + i,
                    date: eventDate.toISOString().split('T')[0],
                    title: `${baseEvent.title}${i > 0 ? ` (${i + 1})` : ''}`
                };
                
                // Remove repeat properties from individual events
                delete event.repeatType;
                delete event.repeatCount;
                
                events.push(event);
            }
            
            return events;
        };

        const baseEvent = {
            ...editingEvent,
            id: editingEvent.id || Date.now(),
            teamIds: editingEvent.teamIds || []
        };

        const eventsToAdd = generateRecurringEvents(baseEvent);

        // Update each selected team's calendar
        const teamIds = baseEvent.teamIds.length > 0 ? baseEvent.teamIds : [selectedTeamId];
        setTeams(currentTeams => currentTeams.map(t => {
            if (teamIds.includes(t.id)) {
                let updatedEvents = t.calendar || [];
                
                if (editingEvent.id && !editingEvent.repeatType) {
                    // Single event edit
                    updatedEvents = updatedEvents.map(event => 
                        event.id === editingEvent.id ? baseEvent : event
                    );
                } else {
                    // New events or recurring events
                    updatedEvents = [...updatedEvents, ...eventsToAdd];
                }
                
                return { ...t, calendar: updatedEvents };
            }
            return t;
        }));
        
        setEditingEvent(null);
    };

    return (
        <div className="max-w-6xl mx-auto">
            {editingEvent && (
                <EventForm 
                    editingEvent={editingEvent}
                    setEditingEvent={setEditingEvent}
                    onSave={handleSave}
                    onCancel={() => setEditingEvent(null)}
                    teams={teams}
                    isTeamSpecific={false}
                    formBackgroundColor={formBackgroundColor}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <select value={selectedTeamId} onChange={e => setSelectedTeamId(e.target.value)} className="p-2 border rounded-md mr-4">
                        <option value="all">All Teams</option>
                        {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                    </select>
                </div>
                <button 
                    onClick={() => setEditingEvent({
                        teamIds: selectedTeamId === 'all' ? [] : [selectedTeamId],
                        type: 'practice', 
                        date: '', 
                        time: '', 
                        title: '', 
                        location: '', 
                        description: '',
                        imageUrl: ''
                    })} 
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add Event
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                {events.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {events.map(event => (
                            <li key={`${event.teamId || selectedTeamId}-${event.id}`} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">
                                                {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                            {selectedTeamId === 'all' && <p className="text-sm font-semibold text-red-700">{event.teamName}</p>}
                                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                                                <span className="flex items-center"><Calendar className="mr-1 h-4 w-4"/>{event.time}</span>
                                                {event.location && (
                                                    <ClickableLocation 
                                                        locationName={event.location}
                                                        teams={teams}
                                                        className="flex items-center"
                                                    >
                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                        {event.location}
                                                    </ClickableLocation>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                    event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                    event.type === 'tournament' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>{event.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingEvent({...event, teamIds: event.teamIds || [event.teamId || selectedTeamId]})} className="text-slate-500 hover:text-slate-700 p-1"><Edit size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <p>No events scheduled. Add the first event!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LeagueInfoManager = ({ leagueInfo, setLeagueInfo, websiteStyle, setWebsiteStyle }) => {
    const [info, setInfo] = useState({
        name: leagueInfo.name || '',
        contactEmail: leagueInfo.contactEmail || '',
        description: leagueInfo.description || '',
        location: leagueInfo.location || '',
        founded: leagueInfo.founded || '',
        website: leagueInfo.website || '',
        social: {
            twitter: leagueInfo.social?.twitter || '',
            instagram: leagueInfo.social?.instagram || '',
            facebook: leagueInfo.social?.facebook || ''
        }
    });
    
    const [tickerStyle, setTickerStyle] = useState({
        tickerColor: websiteStyle?.tickerColor || '#1e293b',
        tickerItemColor: websiteStyle?.tickerItemColor || '#334155', 
        tickerBorderColor: websiteStyle?.tickerBorderColor || '#475569',
        tickerTextColor: websiteStyle?.tickerTextColor || '#94a3b8'
    });

    const [saved, setSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setLeagueInfo(info);
        if (setWebsiteStyle) {
            setWebsiteStyle(prev => ({...prev, ...tickerStyle}));
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleSocialChange = (platform, value) => {
        setInfo(prev => ({
            ...prev,
            social: { ...prev.social, [platform]: value }
        }));
    };

    return (
        <div className="max-w-6xl mx-auto">
            <form onSubmit={handleSave} className="space-y-8">
                {/* League Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                            <Trophy className="mr-2" size={20} />
                            League Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">League Name</label>
                                <input
                                    type="text"
                                    value={info.name}
                                    onChange={(e) => setInfo(prev => ({...prev, name: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Men's Lacrosse Beer League"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Location/Region</label>
                                <input
                                    type="text"
                                    value={info.location}
                                    onChange={(e) => setInfo(prev => ({...prev, location: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Ohio Valley Region"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Founded Year</label>
                                <input
                                    type="text"
                                    value={info.founded}
                                    onChange={(e) => setInfo(prev => ({...prev, founded: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="2020"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Website URL</label>
                                <input
                                    type="url"
                                    value={info.website}
                                    onChange={(e) => setInfo(prev => ({...prev, website: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="https://mlbl.org"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Contact Email</label>
                                <input
                                    type="email"
                                    value={info.contactEmail}
                                    onChange={(e) => setInfo(prev => ({...prev, contactEmail: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="admin@mlbl.org"
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">League Description</label>
                                <textarea
                                    value={info.description}
                                    onChange={(e) => setInfo(prev => ({...prev, description: e.target.value}))}
                                    rows="4"
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    placeholder="Describe your league..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ticker Styling */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                            <Palette className="mr-2" size={20} />
                            Game Ticker Styling
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Ticker Background</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3" style={{ backgroundColor: tickerStyle.tickerColor }}>
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {tickerStyle.tickerColor}
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Game Card Background</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3" style={{ backgroundColor: tickerStyle.tickerItemColor }}>
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {tickerStyle.tickerItemColor}
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerItemColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerItemColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Card Border Color</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3" style={{ backgroundColor: tickerStyle.tickerBorderColor }}>
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {tickerStyle.tickerBorderColor}
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerBorderColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerBorderColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Secondary Text Color</label>
                                <div className="relative">
                                    <div className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3 bg-slate-800">
                                        <span className="font-semibold text-sm px-2 py-1 rounded" style={{ color: tickerStyle.tickerTextColor }}>
                                            {tickerStyle.tickerTextColor} Sample
                                        </span>
                                    </div>
                                    <input type="color" value={tickerStyle.tickerTextColor} onChange={(e) => setTickerStyle(prev => ({...prev, tickerTextColor: e.target.value}))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="mr-2" size={20} />
                        League Social Media
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Twitter className="mr-2 text-blue-400" size={18} />
                                Twitter/X
                            </label>
                            <input
                                type="url"
                                value={info.social.twitter}
                                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://twitter.com/mlbl"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Instagram className="mr-2 text-pink-500" size={18} />
                                Instagram
                            </label>
                            <input
                                type="url"
                                value={info.social.instagram}
                                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://instagram.com/mlbl"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Facebook className="mr-2 text-blue-600" size={18} />
                                Facebook
                            </label>
                            <input
                                type="url"
                                value={info.social.facebook}
                                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://facebook.com/mlbl"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end items-center space-x-4">
                    {saved && (
                        <div className="flex items-center text-green-600">
                            <span className="mr-2">✓</span>
                            <span className="font-semibold">League information saved successfully!</span>
                        </div>
                    )}
                    <button type="submit" className="bg-red-800 text-white px-8 py-3 rounded-lg hover:bg-red-900 font-semibold flex items-center">
                        <Settings className="mr-2" size={18} />
                        Save League Settings
                    </button>
                </div>
            </form>
        </div>
    );
};

const EventForm = ({ editingEvent, setEditingEvent, onSave, onCancel, teams, isTeamSpecific = false, currentTeamId = null, formBackgroundColor = '#f8fafc' }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
        <div 
            className="p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: formBackgroundColor }}
        >
            <h3 className="text-2xl font-bold mb-4">{editingEvent?.id ? 'Edit Event' : 'Add New Event'}</h3>
            <form onSubmit={onSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="date" 
                        value={editingEvent?.date || ''} 
                        onChange={e => setEditingEvent(prev => ({...prev, date: e.target.value}))} 
                        className="w-full p-2 border rounded" 
                        required 
                    />
                    <select 
                        value={editingEvent?.time || ''} 
                        onChange={e => setEditingEvent(prev => ({...prev, time: e.target.value}))} 
                        className="w-full p-2 border rounded" 
                        required 
                    >
                        <option value="">Select Time</option>
                        {Array.from({ length: 96 }, (_, i) => {
                            const hour = Math.floor(i / 4);
                            const minute = (i % 4) * 15;
                            const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                            const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
                            const period = hour < 12 ? 'AM' : 'PM';
                            const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
                            return (
                                <option key={time24} value={time24}>{time12}</option>
                            );
                        })}
                    </select>
                </div>
                <input 
                    type="text" 
                    value={editingEvent?.title || ''} 
                    onChange={e => setEditingEvent(prev => ({...prev, title: e.target.value}))} 
                    placeholder="Event Title" 
                    className="w-full p-2 border rounded" 
                    required 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select 
                        value={editingEvent?.type || 'practice'} 
                        onChange={e => setEditingEvent(prev => ({...prev, type: e.target.value}))} 
                        className="w-full p-2 border rounded"
                    >
                        <option value="practice">Practice</option>
                        <option value="game">Game</option>
                        <option value="scrimmage">Scrimmage</option>
                        <option value="tournament">Tournament</option>
                        <option value="social">Social Event</option>
                        <option value="meeting">Team Meeting</option>
                    </select>
                    {/* Location Dropdown from Team Locations */}
                    <div className="relative">
                        <select 
                            value={editingEvent?.location || ''} 
                            onChange={e => setEditingEvent(prev => ({...prev, location: e.target.value}))} 
                            className="w-full p-2 border rounded"
                            required
                        >
                            <option value="">Select Location</option>
                            {(() => {
                                // Collect all locations from relevant teams
                                const allLocations = [];
                                
                                if (isTeamSpecific && currentTeamId) {
                                    // For team-specific events, show only current team's locations
                                    const currentTeam = teams.find(t => t.id === currentTeamId);
                                    if (currentTeam?.locations) {
                                        allLocations.push(...currentTeam.locations.map(loc => ({...loc, teamName: currentTeam.name})));
                                    }
                                } else {
                                    // For league events, show all teams' locations
                                    teams.forEach(team => {
                                        if (team.locations) {
                                            allLocations.push(...team.locations.map(loc => ({...loc, teamName: team.name})));
                                        }
                                    });
                                }
                                
                                return allLocations.map(location => (
                                    <option key={`${location.teamName}-${location.id}`} value={location.name}>
                                        {location.name} {!isTeamSpecific ? `(${location.teamName})` : ''}
                                    </option>
                                ));
                            })()}
                            <option value="custom">+ Add Custom Location</option>
                        </select>
                        
                        {editingEvent?.location === 'custom' && (
                            <input 
                                type="text" 
                                value={editingEvent?.customLocation || ''} 
                                onChange={e => setEditingEvent(prev => ({...prev, customLocation: e.target.value}))} 
                                placeholder="Enter custom location" 
                                className="w-full p-2 border rounded mt-2" 
                                required
                            />
                        )}
                    </div>
                </div>
                <textarea 
                    value={editingEvent?.description || ''} 
                    onChange={e => setEditingEvent(prev => ({...prev, description: e.target.value}))} 
                    placeholder="Description (optional)" 
                    className="w-full p-2 border rounded" 
                    rows="3"
                />
                
                {/* Event Photo Upload */}
                <div>
                    <FileUploadInput
                        label="Event Photo (Optional)"
                        accept="image/*"
                        currentValue={editingEvent.imageUrl || ''}
                        onChange={(url) => setEditingEvent(prev => ({...prev, imageUrl: url}))}
                        placeholder="Upload event image"
                        enableCrop={false}
                        cropAspectRatio="16:9"
                    />
                </div>
                
                {/* RSVP Settings */}
                <div className="border rounded-lg p-4 bg-green-50">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                        <UserCheck className="mr-2" size={16} />
                        RSVP & Attendance Settings
                    </h4>
                    
                    <div className="space-y-3">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={editingEvent?.rsvp?.enabled || false}
                                onChange={(e) => setEditingEvent(prev => ({
                                    ...prev,
                                    rsvp: {
                                        ...prev.rsvp,
                                        enabled: e.target.checked,
                                        responses: prev.rsvp?.responses || [],
                                        requiresResponse: prev.rsvp?.requiresResponse || false,
                                        remindersSent: prev.rsvp?.remindersSent || []
                                    }
                                }))}
                                className="rounded"
                            />
                            <span className="font-medium text-slate-700">Enable RSVP for this event</span>
                        </label>
                        
                        {editingEvent?.rsvp?.enabled && (
                            <div className="ml-6 space-y-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={editingEvent?.rsvp?.requiresResponse || false}
                                        onChange={(e) => setEditingEvent(prev => ({
                                            ...prev,
                                            rsvp: {
                                                ...prev.rsvp,
                                                requiresResponse: e.target.checked
                                            }
                                        }))}
                                        className="rounded"
                                    />
                                    <span className="text-slate-600">Require response from team members</span>
                                </label>
                                
                                <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                                    <strong>RSVP Features:</strong> Team members can respond Yes/Maybe/No • 
                                    Attendance tracking • Automatic reminders • Response analytics
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Repeat Options */}
                <div className="border rounded-lg p-4 bg-slate-50">
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                        <Calendar className="mr-2" size={16} />
                        Repeat Event
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Repeat Type</label>
                            <select 
                                value={editingEvent?.repeatType || 'none'} 
                                onChange={e => setEditingEvent(prev => ({...prev, repeatType: e.target.value}))} 
                                className="w-full p-2 border rounded"
                            >
                                <option value="none">No Repeat</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="biweekly">Bi-Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        
                        {editingEvent?.repeatType && editingEvent?.repeatType !== 'none' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Occurrences</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="52" 
                                    value={editingEvent?.repeatCount || 1} 
                                    onChange={e => setEditingEvent(prev => ({...prev, repeatCount: parseInt(e.target.value) || 1}))} 
                                    placeholder="Number of events" 
                                    className="w-full p-2 border rounded" 
                                />
                            </div>
                        )}
                    </div>
                    
                    {editingEvent?.repeatType && editingEvent?.repeatType !== 'none' && (
                        <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">
                                <strong>Preview:</strong> This will create {editingEvent?.repeatCount || 1} events 
                                {editingEvent?.repeatType === 'daily' && ' daily'}
                                {editingEvent?.repeatType === 'weekly' && ' weekly'}
                                {editingEvent?.repeatType === 'biweekly' && ' every two weeks'}
                                {editingEvent?.repeatType === 'monthly' && ' monthly'}
                                {editingEvent?.date && ` starting from ${new Date(editingEvent.date).toLocaleDateString()}`}
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Team Selection */}
                {!isTeamSpecific && (
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Teams</label>
                        <div className="border rounded-lg p-3 max-h-32 overflow-y-auto bg-slate-50">
                            <div className="grid grid-cols-1 gap-2">
                                {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                    <label key={team.id} className="flex items-center space-x-2 hover:bg-white p-1 rounded">
                                        <input
                                            type="checkbox"
                                            checked={(editingEvent?.teamIds || []).includes(team.id)}
                                            onChange={(e) => {
                                                const teamIds = editingEvent?.teamIds || [];
                                                const newTeamIds = e.target.checked
                                                    ? [...teamIds, team.id]
                                                    : teamIds.filter(id => id !== team.id);
                                                setEditingEvent(prev => ({...prev, teamIds: newTeamIds}));
                                            }}
                                            className="rounded"
                                        />
                                        <img src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} alt={team.name} className="w-6 h-6 rounded-full" />
                                        <span className="text-sm font-medium">{team.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Select which team(s) this event applies to</p>
                    </div>
                )}

                {/* Photo Upload */}
                <div>
                    <FileUploadInput
                        label="Event Photo"
                        accept="image/*"
                        currentValue={editingEvent.imageUrl || ''}
                        onChange={(url) => setEditingEvent(prev => ({...prev, imageUrl: url}))}
                        placeholder="Upload event image"
                        enableCrop={false}
                        cropAspectRatio="16:9"
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                    <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Event</button>
                </div>
            </form>
        </div>
    </div>
);

const TeamCalendarManager = ({ team, teams, setTeams, websiteStyle }) => {
    const [editingEvent, setEditingEvent] = useState(null);
    
    // Get form background color from website style or default
    const formBackgroundColor = websiteStyle?.formBackgroundColor || '#f8fafc';

    const handleSave = (e) => {
        e.preventDefault();
        
        // Helper function to generate recurring events
        const generateRecurringEvents = (baseEvent) => {
            if (!baseEvent.repeatType || baseEvent.repeatType === 'none' || !baseEvent.repeatCount) {
                return [baseEvent];
            }
            
            const events = [];
            const startDate = new Date(baseEvent.date);
            
            for (let i = 0; i < baseEvent.repeatCount; i++) {
                const eventDate = new Date(startDate);
                
                switch (baseEvent.repeatType) {
                    case 'daily':
                        eventDate.setDate(startDate.getDate() + i);
                        break;
                    case 'weekly':
                        eventDate.setDate(startDate.getDate() + (i * 7));
                        break;
                    case 'biweekly':
                        eventDate.setDate(startDate.getDate() + (i * 14));
                        break;
                    case 'monthly':
                        eventDate.setMonth(startDate.getMonth() + i);
                        break;
                }
                
                const event = {
                    ...baseEvent,
                    id: (baseEvent.id || Date.now()) + i,
                    date: eventDate.toISOString().split('T')[0],
                    title: `${baseEvent.title}${i > 0 ? ` (${i + 1})` : ''}`
                };
                
                // Remove repeat properties from individual events
                delete event.repeatType;
                delete event.repeatCount;
                
                events.push(event);
            }
            
            return events;
        };

        const baseEvent = {
            ...editingEvent,
            id: editingEvent.id || Date.now()
        };

        const eventsToAdd = generateRecurringEvents(baseEvent);

        // If it's a tournament or has multiple teams, add to all selected teams
        const targetTeamIds = editingEvent.teamIds && editingEvent.teamIds.length > 0 
            ? editingEvent.teamIds 
            : [team.id]; // Default to current team

        setTeams(currentTeams => currentTeams.map(t => {
            if (targetTeamIds.includes(t.id)) {
                let updatedEvents = t.calendar || [];
                
                if (editingEvent.id && !editingEvent.repeatType) {
                    // Single event edit
                    updatedEvents = updatedEvents.map(event => 
                        event.id === editingEvent.id ? baseEvent : event
                    );
                } else {
                    // New events or recurring events
                    updatedEvents = [...updatedEvents, ...eventsToAdd];
                }
                
                return { ...t, calendar: updatedEvents };
            }
            return t;
        }));
        
        setEditingEvent(null);
    };

    const handleDelete = (eventId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, calendar: (t.calendar || []).filter(event => event.id !== eventId) };
            }
            return t;
        }));
    };

    const events = team.calendar || [];

    return (
        <div className="max-w-4xl mx-auto">
            {editingEvent && (
                <EventForm 
                    editingEvent={editingEvent}
                    setEditingEvent={setEditingEvent}
                    onSave={handleSave}
                    onCancel={() => setEditingEvent(null)}
                    teams={teams}
                    isTeamSpecific={false} // Allow team selection even from team calendar
                    currentTeamId={team.id}
                    formBackgroundColor={formBackgroundColor}
                />
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Calendar Management</h2>
                 <button 
                    onClick={() => setEditingEvent({
                        teamIds: [team.id], 
                        type: 'practice', 
                        date: '', 
                        time: '', 
                        title: '', 
                        location: '', 
                        description: '',
                        imageUrl: ''
                    })} 
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add Event
                </button>
            </div>
            
            <div className="bg-white rounded-lg shadow-md">
                {events.length > 0 ? (
                    <ul className="divide-y divide-slate-200">
                        {events.map(event => (
                            <li key={event.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-4">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-slate-800">
                                                {new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', timeZone: 'UTC' })}
                                            </div>
                                            <div className="text-sm text-slate-500">
                                                {new Date(event.date).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}
                                            </div>
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                            <div className="flex items-center space-x-4 text-sm text-slate-600">
                                                <span className="flex items-center">
                                                    <Calendar className="mr-1 h-4 w-4"/>
                                                    {event.time}
                                                </span>
                                                {event.location && (
                                                    <ClickableLocation 
                                                        locationName={event.location}
                                                        teams={teams}
                                                        className="flex items-center"
                                                    >
                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                        {event.location}
                                                    </ClickableLocation>
                                                )}
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                    event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                    event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                    event.type === 'tournament' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-slate-100 text-slate-800'
                                                }`}>
                                                    {event.type}
                                                </span>
                                            </div>
                                            {event.description && (
                                                <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => setEditingEvent(event)} className="text-slate-500 hover:text-slate-700 p-1"><Edit size={18}/></button>
                                    <button onClick={() => handleDelete(event.id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <p>No events scheduled yet. Add your first event!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const GalleryForm = ({ editingGallery, setEditingGallery, onSave, onCancel, galleryType }) => {
    const [galleryName, setGalleryName] = useState(editingGallery?.name || '');
    const [galleryDescription, setGalleryDescription] = useState(editingGallery?.description || '');
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...editingGallery,
            name: galleryName,
            description: galleryDescription,
            type: galleryType,
            id: editingGallery?.id || Date.now(),
            items: editingGallery?.items || [],
            createdAt: editingGallery?.createdAt || new Date().toISOString()
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-2xl font-bold mb-4">
                    {editingGallery?.id ? 'Edit' : 'Create New'} {galleryType === 'photo' ? 'Photo Gallery' : 'Video Collection'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Gallery Name</label>
                        <input 
                            type="text" 
                            value={galleryName}
                            onChange={(e) => setGalleryName(e.target.value)}
                            placeholder="e.g., Championship Games, Team Photos"
                            className="w-full p-2 border rounded" 
                            required 
                        />
                    </div>
                    
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Description</label>
                        <textarea 
                            value={galleryDescription}
                            onChange={(e) => setGalleryDescription(e.target.value)}
                            placeholder="Brief description of this gallery..."
                            className="w-full p-2 border rounded h-24 resize-none" 
                            required 
                        />
                    </div>

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Create Gallery</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ItemForm = ({ editingItem, setEditingItem, onSave, onCancel, itemType, galleryId }) => {
    const [itemData, setItemData] = useState({
        caption: editingItem?.caption || '',
        url: editingItem?.url || '',
        ...editingItem
    });
    const [multipleImages, setMultipleImages] = useState([]);
    const [isMultipleMode, setIsMultipleMode] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (isMultipleMode && multipleImages.length > 0) {
            // Save multiple images - call onSave for each image separately
            multipleImages.forEach((image, index) => {
                setTimeout(() => {
                    onSave({
                        id: Date.now() + index,
                        type: itemType,
                        galleryId: galleryId,
                        addedAt: new Date().toISOString(),
                        url: image.url,
                        caption: image.caption || `Image ${index + 1}`
                    });
                }, index * 100); // Small delay to ensure unique IDs
            });
        } else {
            // Save single image (original behavior)
            onSave({
                ...itemData,
                id: editingItem?.id || Date.now(),
                type: itemType,
                galleryId: galleryId,
                addedAt: editingItem?.addedAt || new Date().toISOString()
            });
        }
    };

    const handleMultipleImageUpload = (url, index) => {
        setMultipleImages(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], url };
            return updated;
        });
    };

    const addImageSlot = () => {
        setMultipleImages(prev => [...prev, { url: '', caption: '' }]);
    };

    const removeImageSlot = (index) => {
        setMultipleImages(prev => prev.filter((_, i) => i !== index));
    };

    const updateImageCaption = (index, caption) => {
        setMultipleImages(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], caption };
            return updated;
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl font-bold mb-4">Add {itemType === 'photo' ? 'Photo' : 'Video'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {itemType === 'photo' ? (
                        <div className="space-y-4">
                            {/* Upload Mode Toggle */}
                            <div className="flex items-center space-x-4 p-3 bg-slate-50 rounded-lg">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="uploadMode"
                                        checked={!isMultipleMode}
                                        onChange={() => setIsMultipleMode(false)}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium">Single Photo</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="uploadMode"
                                        checked={isMultipleMode}
                                        onChange={() => {
                                            setIsMultipleMode(true);
                                            if (multipleImages.length === 0) {
                                                setMultipleImages([{ url: '', caption: '' }]);
                                            }
                                        }}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium">Multiple Photos</span>
                                </label>
                            </div>

                            {!isMultipleMode ? (
                                /* Single Photo Upload */
                                <div>
                                    <FileUploadInput
                                        label="Photo Upload"
                                        accept="image/*"
                                        currentValue={itemData.url || ''}
                                        onChange={(url) => setItemData(prev => ({...prev, url: url}))}
                                        placeholder="Upload gallery photo"
                                        enableCrop={false}
                                        cropAspectRatio="free"
                                    />
                                </div>
                            ) : (
                                /* Multiple Photos Upload - Direct File Selection */
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-semibold">Multiple Photos Upload</h4>
                                    </div>
                                    
                                    <div 
                                        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer transition-colors hover:border-slate-400"
                                        onClick={() => document.getElementById('multipleFileInput').click()}
                                    >
                                        <input
                                            id="multipleFileInput"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={(e) => {
                                                const files = Array.from(e.target.files);
                                                const newImages = files.map((file, index) => ({
                                                    url: URL.createObjectURL(file),
                                                    caption: `Photo ${index + 1}`,
                                                    file: file
                                                }));
                                                setMultipleImages(newImages);
                                            }}
                                            className="hidden"
                                        />
                                        
                                        {multipleImages.length === 0 ? (
                                            <div>
                                                <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                                <h3 className="text-lg font-semibold text-slate-700 mb-2">Select Multiple Photos</h3>
                                                <p className="text-slate-600">Click here to select multiple images at once</p>
                                                <p className="text-sm text-slate-500 mt-2">You can select multiple files and upload them all together</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <ImageIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
                                                <p className="text-green-600 font-medium">{multipleImages.length} photos selected</p>
                                                <p className="text-sm text-slate-500">Click to select different photos</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {multipleImages.length > 0 && (
                                        <div className="space-y-3">
                                            <h5 className="font-medium text-slate-700">Selected Photos:</h5>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                {multipleImages.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img 
                                                            src={image.url} 
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-24 object-cover rounded border"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeImageSlot(index)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                        <input
                                                            type="text"
                                                            value={image.caption || ''}
                                                            onChange={(e) => updateImageCaption(index, e.target.value)}
                                                            placeholder="Caption (optional)"
                                                            className="w-full p-1 border rounded text-xs mt-1"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">YouTube URL or Video URL</label>
                            <input 
                                type="url" 
                                value={itemData.url}
                                onChange={(e) => setItemData(prev => ({...prev, url: e.target.value}))}
                                placeholder="https://www.youtube.com/watch?v=..." 
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                    )}
                    
                    {/* Caption - Only for single mode */}
                    {(!isMultipleMode || itemType === 'video') && (
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Caption/Description</label>
                            <input 
                                type="text" 
                                value={itemData.caption}
                                onChange={(e) => setItemData(prev => ({...prev, caption: e.target.value}))}
                                placeholder="Caption/Description" 
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                    )}
                    
                    {itemData.url && itemType === 'video' && (
                        <div className="mt-2">
                            <div className="bg-slate-100 p-4 rounded-lg">
                                <p className="text-sm text-slate-600">Video URL: {itemData.url}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Add {itemType === 'photo' ? 'Photo' : 'Video'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const Slideshow = ({ items, isOpen, onClose, startIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(startIndex);
    
    if (!isOpen || !items.length) return null;

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    const currentItem = items[currentIndex];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-4xl max-h-full">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white hover:text-gray-300 z-60"
                >
                    <X size={32} />
                </button>
                
                {items.length > 1 && (
                    <>
                        <button 
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-60"
                        >
                            <ChevronLeft size={48} />
                        </button>
                        <button 
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-60"
                        >
                            <ChevronRight size={48} />
                        </button>
                    </>
                )}
                
                <div className="bg-white rounded-lg overflow-hidden">
                    <div className="aspect-w-16 aspect-h-12">
                        {currentItem.type === 'photo' ? (
                            <img 
                                src={currentItem.url} 
                                alt={currentItem.caption}
                                className="w-full h-96 object-contain bg-black"
                            />
                        ) : (
                            <div className="h-96 flex items-center justify-center bg-black">
                                {currentItem.url.includes('youtube.com') || currentItem.url.includes('youtu.be') ? (
                                    <iframe 
                                        src={currentItem.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                                        title={currentItem.caption} 
                                        frameBorder="0" 
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen 
                                        className="w-full h-full"
                                    />
                                ) : (
                                    <video controls className="w-full h-full">
                                        <source src={currentItem.url} type="video/mp4" />
                                        Your browser does not support the video tag.
                                    </video>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="p-4">
                        <h3 className="text-lg font-semibold text-slate-800 mb-2">{currentItem.caption}</h3>
                        <div className="flex justify-between items-center text-sm text-slate-500">
                            <span>Added {new Date(currentItem.addedAt).toLocaleDateString()}</span>
                            <span>{currentIndex + 1} of {items.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MediaManager = ({ team, setTeams }) => {
    const [activeTab, setActiveTab] = useState('photos');
    const [editingGallery, setEditingGallery] = useState(null);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedGallery, setSelectedGallery] = useState(null);
    const [slideshow, setSlideshow] = useState({ isOpen: false, items: [], startIndex: 0 });
    
    const galleries = team.galleries || [];
    const photoGalleries = galleries.filter(g => g.type === 'photo').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const videoGalleries = galleries.filter(g => g.type === 'video').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const handleSaveGallery = (galleryData) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGalleries = galleryData.id && (t.galleries || []).find(g => g.id === galleryData.id)
                    ? (t.galleries || []).map(g => g.id === galleryData.id ? galleryData : g)
                    : [...(t.galleries || []), galleryData];
                return { ...t, galleries: updatedGalleries };
            }
            return t;
        }));
        setEditingGallery(null);
    };

    const handleSaveItem = (itemData) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGalleries = (t.galleries || []).map(g => {
                    if (g.id === selectedGallery.id) {
                        const updatedItems = itemData.id && (g.items || []).find(i => i.id === itemData.id)
                            ? (g.items || []).map(i => i.id === itemData.id ? itemData : i)
                            : [...(g.items || []), itemData];
                        return { ...g, items: updatedItems };
                    }
                    return g;
                });
                return { ...t, galleries: updatedGalleries };
            }
            return t;
        }));
        setEditingItem(null);
    };

    const handleDeleteGallery = (galleryId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, galleries: (t.galleries || []).filter(g => g.id !== galleryId) };
            }
            return t;
        }));
    };

    const handleDeleteItem = (galleryId, itemId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGalleries = (t.galleries || []).map(g => {
                    if (g.id === galleryId) {
                        return { ...g, items: (g.items || []).filter(i => i.id !== itemId) };
                    }
                    return g;
                });
                return { ...t, galleries: updatedGalleries };
            }
            return t;
        }));
    };

    const openSlideshow = (items, startIndex = 0) => {
        setSlideshow({ isOpen: true, items, startIndex });
    };

    return (
        <div className="max-w-6xl mx-auto">
            {editingGallery && (
                <GalleryForm
                    editingGallery={editingGallery}
                    setEditingGallery={setEditingGallery}
                    onSave={handleSaveGallery}
                    onCancel={() => setEditingGallery(null)}
                    galleryType={activeTab === 'photos' ? 'photo' : 'video'}
                />
            )}
            
            {editingItem && (
                <ItemForm
                    editingItem={editingItem}
                    setEditingItem={setEditingItem}
                    onSave={handleSaveItem}
                    onCancel={() => setEditingItem(null)}
                    itemType={activeTab === 'photos' ? 'photo' : 'video'}
                    galleryId={selectedGallery?.id}
                />
            )}
            
            <Slideshow 
                items={slideshow.items}
                isOpen={slideshow.isOpen}
                onClose={() => setSlideshow({ isOpen: false, items: [], startIndex: 0 })}
                startIndex={slideshow.startIndex}
            />
            
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Media Management</h2>
                <button 
                    onClick={() => setEditingGallery({ name: '', description: '', type: activeTab === 'photos' ? 'photo' : 'video' })} 
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Create New {activeTab === 'photos' ? 'Photo Gallery' : 'Video Collection'}
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-4 mb-6 border-b">
                <button 
                    onClick={() => setActiveTab('photos')}
                    className={`pb-2 px-1 ${activeTab === 'photos' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    <ImageIcon className="mr-2 inline" size={18} />
                    Photo Galleries ({photoGalleries.length})
                </button>
                <button 
                    onClick={() => setActiveTab('videos')}
                    className={`pb-2 px-1 ${activeTab === 'videos' ? 'border-b-2 border-red-600 text-red-600 font-semibold' : 'text-slate-600'}`}
                >
                    <Video className="mr-2 inline" size={18} />
                    Video Collections ({videoGalleries.length})
                </button>
            </div>

            {/* Gallery Display */}
            <div className="space-y-8">
                {(activeTab === 'photos' ? photoGalleries : videoGalleries).map(gallery => (
                    <div key={gallery.id} className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-grow">
                                <h3 className="text-xl font-semibold text-slate-800 mb-2">{gallery.name}</h3>
                                <p className="text-slate-600 mb-2">{gallery.description}</p>
                                <div className="flex items-center space-x-4 text-sm text-slate-500">
                                    <span>Created: {new Date(gallery.createdAt).toLocaleDateString()}</span>
                                    <span>{(gallery.items || []).length} {activeTab === 'photos' ? 'photos' : 'videos'}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                                <button 
                                    onClick={() => {
                                        setSelectedGallery(gallery);
                                        setEditingItem({ galleryId: gallery.id });
                                    }}
                                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                                >
                                    <Plus className="mr-1 h-3 w-3"/> Add {activeTab === 'photos' ? 'Photo' : 'Video'}
                                </button>
                                <button 
                                    onClick={() => setEditingGallery(gallery)} 
                                    className="text-slate-500 hover:text-slate-700 p-1"
                                    title="Edit gallery"
                                >
                                    <Edit size={16}/>
                                </button>
                                <button 
                                    onClick={() => handleDeleteGallery(gallery.id)} 
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete gallery"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </div>
                        </div>

                        {/* Gallery Items */}
                        {(gallery.items || []).length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {(gallery.items || []).map((item, index) => (
                                    <div key={item.id} className="group relative bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                                        <div 
                                            onClick={() => openSlideshow(gallery.items, index)}
                                            className="aspect-square relative overflow-hidden"
                                        >
                                            {activeTab === 'photos' ? (
                                                <img 
                                                    src={item.url} 
                                                    alt={item.caption} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                                    {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                                                        <div className="relative w-full h-full">
                                                            <img 
                                                                src={`https://img.youtube.com/vi/${item.url.split('v=')[1]?.split('&')[0] || item.url.split('/').pop()}/0.jpg`}
                                                                alt={item.caption}
                                                                className="w-full h-full object-cover"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="bg-red-600 rounded-full p-2">
                                                                    <Video className="text-white" size={24} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <Video className="text-slate-400" size={32} />
                                                    )}
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-white rounded-full p-2">
                                                        <Eye className="text-slate-800" size={20} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <p className="text-sm font-medium text-slate-800 truncate">{item.caption}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-slate-500">
                                                    {new Date(item.addedAt).toLocaleDateString()}
                                                </span>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteItem(gallery.id, item.id);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Delete item"
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 rounded-lg">
                                {activeTab === 'photos' ? (
                                    <ImageIcon className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                ) : (
                                    <Video className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                                )}
                                <p>No {activeTab === 'photos' ? 'photos' : 'videos'} in this gallery yet.</p>
                                <button 
                                    onClick={() => {
                                        setSelectedGallery(gallery);
                                        setEditingItem({ galleryId: gallery.id });
                                    }}
                                    className="mt-2 text-red-600 hover:text-red-800 font-medium"
                                >
                                    Add the first {activeTab === 'photos' ? 'photo' : 'video'} →
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {(activeTab === 'photos' ? photoGalleries : videoGalleries).length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        {activeTab === 'photos' ? (
                            <ImageIcon className="mx-auto h-16 w-16 text-slate-300 mb-4"/>
                        ) : (
                            <Video className="mx-auto h-16 w-16 text-slate-300 mb-4"/>
                        )}
                        <h3 className="text-xl font-semibold mb-2">No {activeTab === 'photos' ? 'Photo Galleries' : 'Video Collections'} Yet</h3>
                        <p className="mb-4">Create your first {activeTab === 'photos' ? 'photo gallery' : 'video collection'} to showcase your team's memories and highlights.</p>
                        <button 
                            onClick={() => setEditingGallery({ name: '', description: '', type: activeTab === 'photos' ? 'photo' : 'video' })}
                            className="bg-red-800 text-white px-6 py-3 rounded hover:bg-red-900 font-medium"
                        >
                            Create First {activeTab === 'photos' ? 'Photo Gallery' : 'Video Collection'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};



const SocialMediaManager = ({ leagueInfo, setLeagueInfo, teams, setTeams, currentUser }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [selectedTeamId, setSelectedTeamId] = useState('league');
    const [postContent, setPostContent] = useState('');
    const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'facebook', 'instagram', 'youtube']);
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [isPosting, setIsPosting] = useState(false);
    const [showCredentialsForm, setShowCredentialsForm] = useState(false);
    
    // Social Media Credentials State - Now team-specific
    const [allCredentials, setAllCredentials] = useState(() => {
        const stored = localStorage.getItem('mlbl_social_credentials_all');
        return stored ? JSON.parse(stored) : {};
    });

    // Get credentials for current selected entity (league or team)
    const currentCredentials = useMemo(() => {
        const credentialsKey = selectedTeamId;
        return allCredentials[credentialsKey] || {
            twitter: {
                api_key: '',
                api_secret: '',
                bearer_token: '',
                access_token: '',
                access_token_secret: '',
                connected: false
            },
            facebook: {
                app_id: '',
                app_secret: '',
                access_token: '',
                page_id: '',
                connected: false
            },
            instagram: {
                app_id: '',
                app_secret: '',
                access_token: '',
                redirect_uri: '',
                business_account_id: '',
                connected: false
            },
            youtube: {
                client_id: '',
                client_secret: '',
                refresh_token: '',
                channel_id: '',
                connected: false
            }
        };
    }, [allCredentials, selectedTeamId]);

    // Save credentials to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('mlbl_social_credentials_all', JSON.stringify(allCredentials));
    }, [allCredentials]);

    // Get current entity (league or team)
    const currentEntity = selectedTeamId === 'league' 
        ? leagueInfo 
        : teams.find(t => t.id === selectedTeamId);

    const handlePost = async (e) => {
        e.preventDefault();
        if (!postContent.trim()) return;

        // Check which platforms are actually connected
        const connectedPlatforms = selectedPlatforms.filter(platform => currentCredentials[platform]?.connected);
        
        if (connectedPlatforms.length === 0) {
            alert('Please connect at least one social media platform before posting.');
            return;
        }

        setIsPosting(true);
        
        try {
            // Here we would call the actual API integration
            // For now, simulate the posting process
            const newPost = {
                id: Date.now(),
                content: postContent,
                platforms: connectedPlatforms,
                entityId: selectedTeamId,
                entityName: currentEntity?.name || 'League',
                timestamp: new Date().toISOString(),
                status: 'posted',
                results: connectedPlatforms.map(platform => ({
                    platform,
                    success: Math.random() > 0.2, // 80% success rate for demo
                    url: `https://${platform}.com/post/${Date.now()}`
                }))
            };

            setScheduledPosts(prev => [newPost, ...prev]);
            setPostContent('');
            
        } catch (error) {
            console.error('Error posting to social media:', error);
            alert('Error posting to social media. Please try again.');
        } finally {
            setTimeout(() => {
                setIsPosting(false);
            }, 2000);
        }
    };

    const handleCredentialChange = (platform, field, value) => {
        const credentialsKey = selectedTeamId;
        setAllCredentials(prev => ({
            ...prev,
            [credentialsKey]: {
                ...prev[credentialsKey] || {
                    twitter: { api_key: '', api_secret: '', bearer_token: '', access_token: '', access_token_secret: '', connected: false },
                    facebook: { app_id: '', app_secret: '', access_token: '', page_id: '', connected: false },
                    instagram: { app_id: '', app_secret: '', access_token: '', redirect_uri: '', business_account_id: '', connected: false },
                    youtube: { client_id: '', client_secret: '', refresh_token: '', channel_id: '', connected: false }
                },
                [platform]: {
                    ...(prev[credentialsKey]?.[platform] || {}),
                    [field]: value
                }
            }
        }));
    };

    const handleTestConnection = async (platform) => {
        const platformCredentials = currentCredentials[platform];
        
        // Check if required fields are filled
        const requiredFields = {
            twitter: ['api_key', 'api_secret', 'access_token', 'access_token_secret'],
            facebook: ['app_id', 'app_secret', 'access_token'],
            instagram: ['app_id', 'app_secret', 'access_token'],
            youtube: ['client_id', 'client_secret', 'refresh_token']
        };

        const missing = requiredFields[platform]?.filter(field => !platformCredentials[field]) || [];
        
        if (missing.length > 0) {
            alert(`Missing required fields for ${platform}: ${missing.join(', ')}`);
            return;
        }

        // Simulate connection test
        const isConnected = Math.random() > 0.3; // 70% success rate for demo
        
        const credentialsKey = selectedTeamId;
        setAllCredentials(prev => ({
            ...prev,
            [credentialsKey]: {
                ...prev[credentialsKey] || {},
                [platform]: {
                    ...prev[credentialsKey]?.[platform] || {},
                    connected: isConnected
                }
            }
        }));

        const entityName = selectedTeamId === 'league' ? 'League' : teams.find(t => t.id === selectedTeamId)?.name || 'Team';

        if (isConnected) {
            alert(`Successfully connected ${platform.charAt(0).toUpperCase() + platform.slice(1)} for ${entityName}!`);
        } else {
            alert(`Failed to connect to ${platform.charAt(0).toUpperCase() + platform.slice(1)} for ${entityName}. Please check your credentials.`);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Layout size={16} /> },
        { id: 'credentials', label: 'API Setup', icon: <Settings size={16} /> },
        { id: 'post', label: 'Create Post', icon: <Plus size={16} /> },
        { id: 'schedule', label: 'Scheduled Posts', icon: <Calendar size={16} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart2 size={16} /> }
    ];

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Social Media Manager</h2>
                        <p className="text-sm text-slate-600 mt-1">
                            Manage social media accounts for {selectedTeamId === 'league' ? 'the league' : `${teams.find(t => t.id === selectedTeamId)?.name || 'team'}`}
                        </p>
                    </div>
                    <div className="text-right">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Managing Account For:</label>
                        <select 
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="px-3 py-2 border rounded-lg bg-white min-w-[200px]"
                        >
                            <option value="league">🏆 League (Main Account)</option>
                            {teams.map(team => (
                                <option key={team.id} value={team.id}>🏒 {team.name} Team</option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">Each has separate credentials</p>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                            activeTab === tab.id 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-600 hover:text-slate-800'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800">Platform Connections</h3>
                            <Settings className="text-slate-400" size={20} />
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Twitter className="text-blue-400" size={18} />
                                    <span className="text-sm">Twitter</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    currentCredentials.twitter.connected 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {currentCredentials.twitter.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Facebook className="text-blue-600" size={18} />
                                    <span className="text-sm">Facebook</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    currentCredentials.facebook.connected 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {currentCredentials.facebook.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Instagram className="text-pink-500" size={18} />
                                    <span className="text-sm">Instagram</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    currentCredentials.instagram.connected 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {currentCredentials.instagram.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Video className="text-red-500" size={18} />
                                    <span className="text-sm">YouTube</span>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded ${
                                    currentCredentials.youtube.connected 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {currentCredentials.youtube.connected ? 'Connected' : 'Not Connected'}
                                </span>
                            </div>
                        </div>
                        {!Object.values(currentCredentials).some(cred => cred.connected) && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    No platforms connected. Go to API Setup to add credentials.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-semibold text-slate-800 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                            <div className="text-sm">
                                <div className="font-medium">Game Result Posted</div>
                                <div className="text-slate-500 text-xs">2 hours ago • All platforms</div>
                            </div>
                            <div className="text-sm">
                                <div className="font-medium">Team Photo Shared</div>
                                <div className="text-slate-500 text-xs">1 day ago • Instagram, Facebook</div>
                            </div>
                            <div className="text-sm">
                                <div className="font-medium">Schedule Update</div>
                                <div className="text-slate-500 text-xs">3 days ago • Twitter</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Posts This Week</span>
                                <span className="font-semibold">12</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Total Followers</span>
                                <span className="font-semibold">1,247</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-slate-600">Engagement Rate</span>
                                <span className="font-semibold text-green-600">4.2%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Post Tab */}
            {activeTab === 'post' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <form onSubmit={handlePost} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Post Content
                            </label>
                            <textarea
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                placeholder="What's happening with the league?"
                                className="w-full p-3 border rounded-lg h-32 resize-none"
                                maxLength={2200}
                            />
                            <div className="text-right text-xs text-slate-500 mt-1">
                                {postContent.length}/2200 characters (optimized per platform)
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Post to Platforms
                            </label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { id: 'twitter', label: 'Twitter', icon: Twitter, color: 'text-blue-400', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
                                    { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
                                    { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
                                    { id: 'youtube', label: 'YouTube', icon: Video, color: 'text-red-500', bgColor: 'bg-red-50', borderColor: 'border-red-200' }
                                ].map(platform => (
                                    <div key={platform.id} className={`relative border-2 rounded-lg p-3 ${
                                        selectedPlatforms.includes(platform.id) 
                                            ? `${platform.bgColor} ${platform.borderColor}` 
                                            : 'bg-gray-50 border-gray-200'
                                    } ${!currentCredentials[platform.id]?.connected ? 'opacity-50' : 'cursor-pointer'}`}>
                                        <label className="cursor-pointer block">
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.includes(platform.id)}
                                                disabled={!currentCredentials[platform.id]?.connected}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPlatforms(prev => [...prev, platform.id]);
                                                    } else {
                                                        setSelectedPlatforms(prev => prev.filter(p => p !== platform.id));
                                                    }
                                                }}
                                                className="sr-only"
                                            />
                                            <div className="flex flex-col items-center space-y-2">
                                                <platform.icon className={platform.color} size={24} />
                                                <span className="text-sm font-medium">{platform.label}</span>
                                                {!currentCredentials[platform.id]?.connected && (
                                                    <span className="text-xs text-red-500">Not Connected</span>
                                                )}
                                                {currentCredentials[platform.id]?.connected && (
                                                    <span className="text-xs text-green-600">Ready</span>
                                                )}
                                            </div>
                                            {selectedPlatforms.includes(platform.id) && (
                                                <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                                                    <Eye size={12} />
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            {selectedPlatforms.filter(p => currentCredentials[p]?.connected).length === 0 && (
                                <p className="text-sm text-red-600 mt-2">
                                    Please connect at least one platform in the API Setup tab before posting.
                                </p>
                            )}
                        </div>

                        {/* Media Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Media (Optional)
                            </label>
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-sm text-slate-600">
                                    Drag & drop images or videos, or click to select
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Supports images (JPG, PNG) and videos (MP4) up to 50MB
                                </p>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        // Handle file selection
                                        console.log('Files selected:', e.target.files);
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
                            >
                                Save Draft
                            </button>
                            <button
                                type="submit"
                                disabled={!postContent.trim() || selectedPlatforms.filter(p => currentCredentials[p]?.connected).length === 0 || isPosting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                            >
                                {isPosting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                        <span>Posting...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Post to {selectedPlatforms.filter(p => currentCredentials[p]?.connected).length} Platform(s)</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Scheduled Posts Tab */}
            {activeTab === 'schedule' && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold">Recent Posts</h3>
                        <button className="text-blue-600 hover:text-blue-800 text-sm">
                            View All
                        </button>
                    </div>
                    
                    {scheduledPosts.length > 0 ? (
                        <div className="space-y-4">
                            {scheduledPosts.slice(0, 5).map(post => (
                                <div key={post.id} className="border rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-grow">
                                            <p className="text-sm text-slate-800">{post.content}</p>
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-4">
                                            {post.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <div className="flex space-x-2">
                                            {post.platforms.map(platform => (
                                                <span key={platform} className="capitalize">{platform}</span>
                                            ))}
                                        </div>
                                        <span>{new Date(post.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Calendar className="mx-auto h-12 w-12 mb-4" />
                            <p>No posts yet</p>
                            <p className="text-sm">Create your first post to get started</p>
                        </div>
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Engagement Overview</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Total Likes</span>
                                <span className="font-semibold">342</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Total Shares</span>
                                <span className="font-semibold">89</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Total Comments</span>
                                <span className="font-semibold">156</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Platform Performance</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Twitter className="text-blue-400" size={16} />
                                    <span className="text-sm">Twitter</span>
                                </div>
                                <span className="text-sm font-semibold">4.2% engagement</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Facebook className="text-blue-600" size={16} />
                                    <span className="text-sm">Facebook</span>
                                </div>
                                <span className="text-sm font-semibold">3.8% engagement</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <Instagram className="text-pink-500" size={16} />
                                    <span className="text-sm">Instagram</span>
                                </div>
                                <span className="text-sm font-semibold">5.1% engagement</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



const LocationManager = ({ team, setTeams }) => {
    const [editingLocation, setEditingLocation] = useState(null);
    const [locationData, setLocationData] = useState({
        name: '',
        address: '',
        description: '',
        type: 'field'
    });

    const locations = team.locations || [];

    const handleSaveLocation = (e) => {
        e.preventDefault();
        const newLocation = {
            ...locationData,
            id: editingLocation?.id || Date.now()
        };

        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedLocations = editingLocation?.id
                    ? (t.locations || []).map(loc => loc.id === editingLocation.id ? newLocation : loc)
                    : [...(t.locations || []), newLocation];
                return { ...t, locations: updatedLocations };
            }
            return t;
        }));
        
        setEditingLocation(null);
        setLocationData({ name: '', address: '', description: '', type: 'field' });
    };

    const handleDeleteLocation = (locationId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, locations: (t.locations || []).filter(loc => loc.id !== locationId) };
            }
            return t;
        }));
    };

    const handleEditLocation = (location) => {
        setEditingLocation(location);
        setLocationData({
            name: location.name,
            address: location.address,
            description: location.description || '',
            type: location.type || 'field'
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Locations</h2>
                <button 
                    onClick={() => {
                        setEditingLocation({});
                        setLocationData({ name: '', address: '', description: '', type: 'field' });
                    }}
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add Location
                </button>
            </div>

            {/* Location Form */}
            {editingLocation !== null && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">
                        {editingLocation.id ? 'Edit Location' : 'Add New Location'}
                    </h3>
                    <form onSubmit={handleSaveLocation} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Location Name</label>
                                <input 
                                    type="text" 
                                    value={locationData.name}
                                    onChange={(e) => setLocationData(prev => ({...prev, name: e.target.value}))}
                                    placeholder="e.g., Main Field, Home Stadium"
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Location Type</label>
                                <select 
                                    value={locationData.type}
                                    onChange={(e) => setLocationData(prev => ({...prev, type: e.target.value}))}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="field">Field</option>
                                    <option value="stadium">Stadium</option>
                                    <option value="gym">Gym</option>
                                    <option value="training">Training Facility</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Address</label>
                            <input 
                                type="text" 
                                value={locationData.address}
                                onChange={(e) => setLocationData(prev => ({...prev, address: e.target.value}))}
                                placeholder="Full address or directions"
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Description (Optional)</label>
                            <textarea 
                                value={locationData.description}
                                onChange={(e) => setLocationData(prev => ({...prev, description: e.target.value}))}
                                placeholder="Additional notes about this location..."
                                className="w-full p-2 border rounded h-20 resize-none" 
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingLocation(null);
                                    setLocationData({ name: '', address: '', description: '', type: 'field' });
                                }}
                                className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                {editingLocation.id ? 'Update Location' : 'Add Location'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Locations List */}
            <div className="space-y-4">
                {locations.length > 0 ? (
                    locations.map(location => (
                        <div key={location.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-grow">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-xl font-semibold text-slate-800">{location.name}</h3>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            location.type === 'field' ? 'bg-green-100 text-green-800' :
                                            location.type === 'stadium' ? 'bg-blue-100 text-blue-800' :
                                            location.type === 'gym' ? 'bg-orange-100 text-orange-800' :
                                            location.type === 'training' ? 'bg-purple-100 text-purple-800' :
                                            'bg-slate-100 text-slate-800'
                                        }`}>
                                            {location.type}
                                        </span>
                                    </div>
                                    <div className="flex items-start space-x-2 text-slate-600">
                                        <MapPin className="mt-0.5" size={16} />
                                        <button 
                                            onClick={() => {
                                                const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=k`;
                                                window.open(mapsUrl, '_blank');
                                            }}
                                            className="text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                            title="Click to open in Google Maps"
                                        >
                                            {location.address}
                                        </button>
                                    </div>
                                    {location.description && (
                                        <p className="text-sm text-slate-500 mt-2">{location.description}</p>
                                    )}
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button 
                                        onClick={() => handleEditLocation(location)}
                                        className="text-slate-500 hover:text-slate-700 p-1"
                                        title="Edit location"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteLocation(location.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete location"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-lg">
                        <MapPin className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No Locations Added Yet</h3>
                        <p className="mb-4">Add your team's practice fields, stadiums, and other venues.</p>
                        <button 
                            onClick={() => {
                                setEditingLocation({});
                                setLocationData({ name: '', address: '', description: '', type: 'field' });
                            }}
                            className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900"
                        >
                            Add First Location
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TeamSocialMediaManager = ({ team, setTeams }) => {
    const [socialMediaData, setSocialMediaData] = useState({
        twitter: team.social?.twitter || '',
        instagram: team.social?.instagram || '',
        facebook: team.social?.facebook || '',
        youtube: team.social?.youtube || ''
    });

    // Memoized handlers to prevent re-renders
    const handleInputChange = useCallback((platform, value) => {
        setSocialMediaData(prev => ({
            ...prev,
            [platform]: value
        }));
    }, []);

    const handleSaveSocialMedia = useCallback((e) => {
        e.preventDefault();
        
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { 
                    ...t, 
                    social: {
                        ...socialMediaData
                    }
                };
            }
            return t;
        }));
        
        alert('Social media settings saved successfully!');
    }, [team.id, socialMediaData, setTeams]);

    return (
        <div className="space-y-6">
            <form onSubmit={handleSaveSocialMedia} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <div className="flex items-center space-x-2">
                            <Twitter size={16} className="text-blue-500" />
                            <span>Twitter/X URL</span>
                        </div>
                    </label>
                    <input
                        type="url"
                        value={socialMediaData.twitter}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        placeholder="https://twitter.com/your_team"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <div className="flex items-center space-x-2">
                            <Instagram size={16} className="text-pink-500" />
                            <span>Instagram URL</span>
                        </div>
                    </label>
                    <input
                        type="url"
                        value={socialMediaData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/your_team"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <div className="flex items-center space-x-2">
                            <Facebook size={16} className="text-blue-600" />
                            <span>Facebook URL</span>
                        </div>
                    </label>
                    <input
                        type="url"
                        value={socialMediaData.facebook}
                        onChange={(e) => handleInputChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/your_team"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        <div className="flex items-center space-x-2">
                            <Video size={16} className="text-red-600" />
                            <span>YouTube URL</span>
                        </div>
                    </label>
                    <input
                        type="url"
                        value={socialMediaData.youtube}
                        onChange={(e) => handleInputChange('youtube', e.target.value)}
                        placeholder="https://youtube.com/@your_team"
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                <button 
                    type="submit"
                    className="w-full bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 transition-colors"
                >
                    Save Social Media Settings
                </button>
            </form>

            <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-slate-700 mb-2">Preview</h4>
                <div className="grid grid-cols-2 gap-2">
                    {socialMediaData.twitter && (
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                            <Twitter size={14} className="text-blue-500" />
                            <span>Twitter Connected</span>
                        </div>
                    )}
                    {socialMediaData.instagram && (
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                            <Instagram size={14} className="text-pink-500" />
                            <span>Instagram Connected</span>
                        </div>
                    )}
                    {socialMediaData.facebook && (
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                            <Facebook size={14} className="text-blue-600" />
                            <span>Facebook Connected</span>
                        </div>
                    )}
                    {socialMediaData.youtube && (
                        <div className="flex items-center space-x-2 text-xs text-slate-600">
                            <Video size={14} className="text-red-600" />
                            <span>YouTube Connected</span>
                        </div>
                    )}
                </div>
                {!socialMediaData.twitter && !socialMediaData.instagram && !socialMediaData.facebook && !socialMediaData.youtube && (
                    <p className="text-xs text-slate-500">No social media platforms connected yet.</p>
                )}
            </div>
        </div>
    );
};

const GroupMeManager = ({ team, setTeams }) => {
    const [editingGroupMe, setEditingGroupMe] = useState(null);
    const [groupMeData, setGroupMeData] = useState({
        name: '',
        url: '',
        description: '',
        image: ''
    });

    const groupMes = team.groupMes || [];

    const handleSaveGroupMe = (e) => {
        e.preventDefault();
        const newGroupMe = {
            ...groupMeData,
            id: editingGroupMe?.id || Date.now()
        };

        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                const updatedGroupMes = editingGroupMe?.id
                    ? (t.groupMes || []).map(gm => gm.id === editingGroupMe.id ? newGroupMe : gm)
                    : [...(t.groupMes || []), newGroupMe];
                return { ...t, groupMes: updatedGroupMes };
            }
            return t;
        }));
        
        setEditingGroupMe(null);
        setGroupMeData({ name: '', url: '', description: '', image: '' });
    };

    const handleDeleteGroupMe = (groupMeId) => {
        setTeams(currentTeams => currentTeams.map(t => {
            if (t.id === team.id) {
                return { ...t, groupMes: (t.groupMes || []).filter(gm => gm.id !== groupMeId) };
            }
            return t;
        }));
    };

    const handleEditGroupMe = (groupMe) => {
        setEditingGroupMe(groupMe);
        setGroupMeData({
            name: groupMe.name,
            url: groupMe.url,
            description: groupMe.description || '',
            image: groupMe.image || ''
        });
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team GroupMe Chats</h2>
                <button 
                    onClick={() => {
                        setEditingGroupMe({});
                        setGroupMeData({ name: '', url: '', description: '', image: '' });
                    }}
                    className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"
                >
                    <Plus className="mr-2 h-4 w-4"/> Add GroupMe
                </button>
            </div>

            {/* GroupMe Form */}
            {editingGroupMe !== null && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4">
                        {editingGroupMe.id ? 'Edit GroupMe' : 'Add New GroupMe'}
                    </h3>
                    <form onSubmit={handleSaveGroupMe} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Chat Name</label>
                                <input 
                                    type="text" 
                                    value={groupMeData.name}
                                    onChange={(e) => setGroupMeData(prev => ({...prev, name: e.target.value}))}
                                    placeholder="e.g., Main Team Chat, Parents Group"
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            <div>
                                <FileUploadInput
                                    label="Chat Image (Optional)"
                                    accept="image/*"
                                    currentValue={groupMeData.image}
                                    onChange={(url) => setGroupMeData(prev => ({...prev, image: url}))}
                                    placeholder="Upload chat group image"
                                    enableCrop={false}
                                    cropAspectRatio="1:1"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">GroupMe Link/URL</label>
                            <input 
                                type="url" 
                                value={groupMeData.url}
                                onChange={(e) => setGroupMeData(prev => ({...prev, url: e.target.value}))}
                                placeholder="https://groupme.com/join_group/..."
                                className="w-full p-2 border rounded" 
                                required 
                            />
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Description (Optional)</label>
                            <textarea 
                                value={groupMeData.description}
                                onChange={(e) => setGroupMeData(prev => ({...prev, description: e.target.value}))}
                                placeholder="Description of this chat group..."
                                className="w-full p-2 border rounded h-20 resize-none" 
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button 
                                type="button" 
                                onClick={() => {
                                    setEditingGroupMe(null);
                                    setGroupMeData({ name: '', url: '', description: '', image: '' });
                                }}
                                className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                {editingGroupMe.id ? 'Update GroupMe' : 'Add GroupMe'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* GroupMe List */}
            <div className="space-y-4">
                {groupMes.length > 0 ? (
                    groupMes.map(groupMe => (
                        <div key={groupMe.id} className="bg-white rounded-lg shadow-md p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 flex-grow">
                                    <div className="flex-shrink-0">
                                        {groupMe.image ? (
                                            <img 
                                                src={groupMe.image} 
                                                alt={groupMe.name}
                                                className="w-12 h-12 rounded-lg object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className={`w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ${groupMe.image ? 'hidden' : 'flex'}`}
                                        >
                                            <MessageSquare className="h-6 w-6 text-blue-600" />
                                        </div>
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="text-lg font-semibold text-slate-800">{groupMe.name}</h3>
                                        {groupMe.description && (
                                            <p className="text-sm text-slate-600 mt-1">{groupMe.description}</p>
                                        )}
                                        <button 
                                            onClick={() => window.open(groupMe.url, '_blank')}
                                            className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                        >
                                            Join GroupMe
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <button 
                                        onClick={() => handleEditGroupMe(groupMe)}
                                        className="text-slate-500 hover:text-slate-700 p-1"
                                        title="Edit GroupMe"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteGroupMe(groupMe.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Delete GroupMe"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-lg">
                        <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">No GroupMe Chats Added Yet</h3>
                        <p className="mb-4">Add your team's GroupMe chats to keep everyone connected.</p>
                        <button 
                            onClick={() => {
                                setEditingGroupMe({});
                                setGroupMeData({ name: '', url: '', description: '', image: '' });
                            }}
                            className="bg-red-800 text-white px-6 py-2 rounded hover:bg-red-900"
                        >
                            Add First GroupMe
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const TeamInfoManager = ({ team, setTeams }) => {
    const [teamInfo, setTeamInfo] = useState({
        name: team.name || '',
        contactEmail: team.contactEmail || '',
        social: {
            twitter: team.social?.twitter || '',
            instagram: team.social?.instagram || '',
            facebook: team.social?.facebook || ''
        },
        location: team.location || '',
        founded: team.founded || '',
        website: team.website || '',
        description: team.description || ''
    });
    const [saved, setSaved] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setTeams(prevTeams => prevTeams.map(t => 
            t.id === team.id ? { 
                ...t, 
                name: teamInfo.name,
                contactEmail: teamInfo.contactEmail,
                social: teamInfo.social,
                location: teamInfo.location,
                founded: teamInfo.founded,
                website: teamInfo.website,
                description: teamInfo.description
            } : t
        ));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleSocialChange = (platform, value) => {
        setTeamInfo(prev => ({
            ...prev,
            social: { ...prev.social, [platform]: value }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Team Information & Contact</h2>
            
            <form onSubmit={handleSave} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Home className="mr-2" size={20} />
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Team Name</label>
                            <input
                                type="text"
                                value={teamInfo.name}
                                onChange={(e) => setTeamInfo(prev => ({...prev, name: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="Enter team name"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={teamInfo.location}
                                onChange={(e) => setTeamInfo(prev => ({...prev, location: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="City, State"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Founded Year</label>
                            <input
                                type="text"
                                value={teamInfo.founded}
                                onChange={(e) => setTeamInfo(prev => ({...prev, founded: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="2020"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Website URL</label>
                            <input
                                type="url"
                                value={teamInfo.website}
                                onChange={(e) => setTeamInfo(prev => ({...prev, website: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://yourteam.com"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block font-semibold text-slate-700 mb-2">Team Description</label>
                        <textarea
                            value={teamInfo.description}
                            onChange={(e) => setTeamInfo(prev => ({...prev, description: e.target.value}))}
                            rows="4"
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="Tell us about your team..."
                        />
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Mail className="mr-2" size={20} />
                        Contact Information
                    </h3>
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Contact Email</label>
                        <input
                            type="email"
                            value={teamInfo.contactEmail}
                            onChange={(e) => setTeamInfo(prev => ({...prev, contactEmail: e.target.value}))}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                            placeholder="coach@yourteam.com"
                        />
                        <p className="text-sm text-slate-500 mt-1">This email will be used for league communications and fan contact.</p>
                    </div>
                </div>

                {/* Social Media */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Users className="mr-2" size={20} />
                        Social Media Links
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Twitter className="mr-2 text-blue-400" size={18} />
                                Twitter/X Profile
                            </label>
                            <input
                                type="url"
                                value={teamInfo.social.twitter}
                                onChange={(e) => handleSocialChange('twitter', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://twitter.com/yourteam or https://x.com/yourteam"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Instagram className="mr-2 text-pink-500" size={18} />
                                Instagram Profile
                            </label>
                            <input
                                type="url"
                                value={teamInfo.social.instagram}
                                onChange={(e) => handleSocialChange('instagram', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://instagram.com/yourteam"
                            />
                        </div>
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2 flex items-center">
                                <Facebook className="mr-2 text-blue-600" size={18} />
                                Facebook Page
                            </label>
                            <input
                                type="url"
                                value={teamInfo.social.facebook}
                                onChange={(e) => handleSocialChange('facebook', e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                placeholder="https://facebook.com/yourteam"
                            />
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end items-center space-x-4">
                    {saved && (
                        <div className="flex items-center text-green-600">
                            <span className="mr-2">✓</span>
                            <span className="font-semibold">Team information saved successfully!</span>
                        </div>
                    )}
                    <button 
                        type="submit" 
                        className="bg-red-800 text-white px-8 py-3 rounded-lg hover:bg-red-900 font-semibold flex items-center"
                    >
                        <Settings className="mr-2" size={18} />
                        Save Team Information
                    </button>
                </div>
            </form>
        </div>
    );
};

const TeamDetailPage = ({ teamId, teams, players, leagueSchedule, currentUser, setPlayers, setTeams, websiteStyle, playMusic, stopAllMusic, musicState, getTeamNewsItems, addTeamNewsItem, updateTeamNewsItem, deleteTeamNewsItem, setSelectedNewsItem, friends, sponsors }) => {
    const team = teams.find(t => t.id === teamId);
    const teamPlayers = players.filter(p => p.teams.includes(teamId) && p.active);
    const teamNewsItems = getTeamNewsItems(teamId);
    const [activeTab, setActiveTab] = useState('home');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
    const [selectedImagePopup, setSelectedImagePopup] = useState(null);
    const [editingPlayerStats, setEditingPlayerStats] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState(null);
    const [managePlayersExpanded, setManagePlayersExpanded] = useState(false);
    const [manageMediaExpanded, setManageMediaExpanded] = useState(false);
    const [manageSocialExpanded, setManageSocialExpanded] = useState(false);
    const [manageContactExpanded, setManageContactExpanded] = useState(false);
    const [manageScheduleExpanded, setManageScheduleExpanded] = useState(false);
    
    // Event type filtering for team schedule
    const [teamEventTypeFilters, setTeamEventTypeFilters] = useState({
        game: true,
        practice: true,
        tournament: true,
        meeting: true,
        social: true,
        other: true
    });
    
    // Memoized handler for team event type filter changes
    const handleTeamEventTypeToggle = useCallback((eventType) => {
        setTeamEventTypeFilters(prev => ({
            ...prev,
            [eventType]: !prev[eventType]
        }));
    }, []);

    // Ensure activeTab is visible, fallback to first visible tab
    React.useEffect(() => {
        if (team?.style?.visibleTabs) {
            const visibleTabs = ['roster', 'schedule', 'media', 'social', 'contact', 'groupme'].filter(
                tab => team.style.visibleTabs[tab] !== false
            );
            if (!visibleTabs.includes(activeTab) && visibleTabs.length > 0) {
                setActiveTab(visibleTabs[0]);
            }
        }
    }, [team, activeTab]);

    // Sort players: coaches first, then players
    const sortedTeamPlayers = teamPlayers.sort((a, b) => {
        const aIsCoach = a.roles && a.roles.includes('coach');
        const bIsCoach = b.roles && b.roles.includes('coach');
        
        if (aIsCoach && !bIsCoach) return -1;
        if (!aIsCoach && bIsCoach) return 1;
        
        // If both are coaches or both are players, sort by last name
        return a.lastName.localeCompare(b.lastName);
    });

    const handlePlayerClick = (player) => {
        setSelectedPlayer(player);
        setIsPlayerModalOpen(true);
    };

    const handleClosePlayerModal = () => {
        setIsPlayerModalOpen(false);
        setSelectedPlayer(null);
    };

    const getTeam = (id) => teams.find(t => t.id === id);
    const isAuthorizedToManage = currentUser && (
        currentUser.roles.includes('admin') || 
        ((currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) && currentUser.teamId === teamId)
    );
    const teamSchedule = leagueSchedule.map(day => ({
        ...day,
        games: day.games.filter(g => g.home === teamId || g.away === teamId)
    })).filter(day => day.games.length > 0);

    if (!team) return <div className="p-8 text-center text-red-500">Team not found!</div>;

    const handleSocialSave = (newSocial) => {
        setTeams(prevTeams => prevTeams.map(t =>
            t.id === teamId ? { ...t, social: newSocial } : t
        ));
    };

    const TeamTab = ({tabName, label, isManagerTab = false}) => {
        if (isManagerTab && !isAuthorizedToManage) return null;
        return (
            <button 
                onClick={() => setActiveTab(tabName)} 
                className={`px-4 py-2 font-semibold border-b-2 transition-colors ${activeTab === tabName ? 'text-slate-800' : 'text-slate-500 border-transparent hover:border-slate-300'}`}
                style={{ borderColor: activeTab === tabName ? (team.style?.primaryColor || '#dc2626') : 'transparent' }}
            >
                {label}
            </button>
        );
    };

    const teamBackgroundStyle = team.style?.pageBackgroundImage ? {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - (team.style.pageBackgroundOpacity !== undefined ? team.style.pageBackgroundOpacity : 0.1)}), rgba(255, 255, 255, ${1 - (team.style.pageBackgroundOpacity !== undefined ? team.style.pageBackgroundOpacity : 0.1)})), url(${team.style.pageBackgroundImage})`,
        backgroundSize: team.style.pageBackgroundMode === 'contain' ? 'contain' : team.style.pageBackgroundMode === 'repeat' ? 'auto' : 'cover',
        backgroundRepeat: team.style.pageBackgroundMode === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
    } : getBackgroundStyle(websiteStyle);

    return (
        <div className="min-h-screen" style={teamBackgroundStyle}>
            <div className="p-4 md:p-8">
                <div 
                    className="bg-cover bg-center h-48 rounded-lg mb-6 flex items-end p-4 shadow-inner relative" 
                    style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${team.style?.bannerUrl || 'https://placehold.co/1200x400/4A5568/FFFFFF?text=MLBL'})` }}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                        <img src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} alt={team.name} className="w-24 h-24 mr-4 rounded-full bg-white p-2 shadow-lg object-contain" />
                        <div>
                            <h1 className="text-5xl font-bold text-white tracking-tight drop-shadow-lg">{team.name}</h1>
                            <p className="text-lg text-white opacity-90 drop-shadow-lg">{team.division} Lacrosse</p>
                        </div>
                    </div>
                    
                    {/* Music Controls */}
                    {team.musicUrl && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    if (musicState.currentTrack?.teamId === team.id && musicState.isPlaying) {
                                        stopAllMusic();
                                    } else {
                                        playMusic(team.musicUrl, `${team.name} Theme`, team.id);
                                    }
                                }}
                                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all shadow-lg"
                                title={musicState.currentTrack?.teamId === team.id && musicState.isPlaying ? "Stop Team Music" : "Play Team Music"}
                            >
                                {musicState.currentTrack?.teamId === team.id && musicState.isPlaying ? 
                                    <Pause size={24} /> : <Play size={24} />
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex border-b mb-6 flex-wrap">
                {(team.style?.visibleTabs?.home !== false) && <TeamTab tabName="home" label="Home" />}
                {(team.style?.visibleTabs?.roster !== false) && <TeamTab tabName="roster" label="Roster" />}
                {(team.style?.visibleTabs?.stats !== false) && <TeamTab tabName="stats" label="Stats" />}
                {(team.style?.visibleTabs?.schedule !== false) && <TeamTab tabName="schedule" label="Schedule" />}
                {(team.style?.visibleTabs?.media !== false) && <TeamTab tabName="media" label="Photos & Videos" />}
                {(team.style?.visibleTabs?.social !== false) && <TeamTab tabName="social" label="Social" />}
                {(team.style?.visibleTabs?.groupme !== false) && <TeamTab tabName="groupme" label="GroupMe" />}
                {(team.style?.visibleTabs?.contact !== false) && <TeamTab tabName="contact" label="Contact" />}
                
                {/* Public Friends & Sponsors Tabs */}
                <TeamTab tabName="friends" label="Friends" />
                <TeamTab tabName="sponsors" label="Sponsors" />
                
                {/* Team Style Management Tab for Authorized Team Managers */}
                {isAuthorizedToManage && (
                    <TeamTab tabName="teamstyle" label="Team Style" />
                )}
            </div>
            
            <div className="p-4 rounded-lg" style={{ backgroundColor: team.style?.backgroundColor || 'transparent' }}>
                {activeTab === 'home' && (
                    <div className="space-y-6">
                        {/* Team Hero Section */}
                        <div className="text-center py-8">
                            <h1 className="text-4xl font-bold mb-4" style={{ color: team.style?.primaryColor || '#dc2626' }}>
                                Welcome to {team.name}
                            </h1>
                            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                                {team.description || `Follow ${team.name} for the latest updates, photos, and team information.`}
                            </p>
                        </div>

                        {/* Quick Team Stats - Moved Above News Feed and Made Smaller */}
                        <div className="bg-white rounded-lg shadow p-4">
                            <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                                <BarChart2 className="mr-2 h-5 w-5" />
                                Team Stats
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xl font-bold mb-1" style={{ color: team.style?.primaryColor || '#dc2626' }}>
                                        {team.wins || 0}
                                    </div>
                                    <div className="text-xs font-medium text-slate-600">Wins</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xl font-bold mb-1 text-red-500">
                                        {team.losses || 0}
                                    </div>
                                    <div className="text-xs font-medium text-slate-600">Losses</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xl font-bold mb-1 text-green-500">
                                        {team.pf || 0}
                                    </div>
                                    <div className="text-xs font-medium text-slate-600">Points For</div>
                                </div>
                                <div className="text-center p-3 bg-slate-50 rounded-lg">
                                    <div className="text-xl font-bold mb-1 text-orange-500">
                                        {team.pa || 0}
                                    </div>
                                    <div className="text-xs font-medium text-slate-600">Points Against</div>
                                </div>
                            </div>
                        </div>

                        {/* Team News Feed - Moved Below Stats */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                                <MessageSquare className="mr-2" />
                                Team News & Updates
                            </h2>
                            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                                <div className="h-96 overflow-y-auto">
                                    <div className="news-feed-scrolling" style={{ 
                                        animation: 'scroll-vertical 20s linear infinite',
                                        animationPlayState: (teamNewsItems && teamNewsItems.length > 3) ? 'running' : 'paused'
                                    }}>
                                        {teamNewsItems && teamNewsItems.length > 0 ? [...teamNewsItems, ...teamNewsItems].map((item, index) => (
                                            <div key={`${item.id}-${index}`} 
                                                className="border-b border-slate-200 p-6 hover:bg-slate-50 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    setSelectedNewsItem(item);
                                                }}
                                            >
                                                <div className="flex items-start space-x-4">
                                                    {/* News Content */}
                                                    <div className="flex-grow">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-lg font-semibold text-slate-800">{item.heading}</h3>
                                                            <span className="text-sm text-slate-500">{new Date(item.date).toLocaleDateString()}</span>
                                                        </div>
                                                        <p className="text-slate-700 mb-2">{item.text}</p>
                                                        {item.comments && (
                                                            <p className="text-sm text-slate-600 italic">{item.comments}</p>
                                                        )}
                                                    </div>
                                                    
                                                    {/* News Image/Icon */}
                                                    <div className="flex-shrink-0">
                                                        {item.type === 'image' && item.imageUrl ? (
                                                            <img src={item.imageUrl} alt={item.heading} className="w-16 h-16 rounded-lg object-cover" />
                                                        ) : item.type === 'video' && item.thumbnailUrl ? (
                                                            <div className="relative">
                                                                <img src={item.thumbnailUrl} alt={item.heading} className="w-16 h-16 rounded-lg object-cover" />
                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                    <Play size={20} className="text-white drop-shadow-lg" />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                                                                <MessageSquare size={24} className="text-blue-600" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )) : (
                                            <div className="p-6 text-center text-slate-500">
                                                <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
                                                <p>No team news available yet.</p>
                                                <p className="text-sm mt-2">Check back later for updates!</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Media Integration */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                                <Share2 className="mr-2" />
                                Connect With Us
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {team.socialMedia?.twitter && (
                                    <a 
                                        href={team.socialMedia.twitter} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center space-x-2 p-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                    >
                                        <Twitter size={20} className="text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Twitter</span>
                                    </a>
                                )}
                                {team.socialMedia?.instagram && (
                                    <a 
                                        href={team.socialMedia.instagram} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center space-x-2 p-3 bg-pink-100 hover:bg-pink-200 rounded-lg transition-colors"
                                    >
                                        <Instagram size={20} className="text-pink-600" />
                                        <span className="text-sm font-medium text-pink-800">Instagram</span>
                                    </a>
                                )}
                                {team.socialMedia?.facebook && (
                                    <a 
                                        href={team.socialMedia.facebook} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center space-x-2 p-3 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                                    >
                                        <Facebook size={20} className="text-blue-700" />
                                        <span className="text-sm font-medium text-blue-900">Facebook</span>
                                    </a>
                                )}
                                <button 
                                    onClick={() => setActiveTab('social')}
                                    className="flex items-center justify-center space-x-2 p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                >
                                    <Plus size={20} className="text-slate-600" />
                                    <span className="text-sm font-medium text-slate-700">View All</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'roster' && (
                    <div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <StatCard title="Wins" value={team.wins} color="text-green-500" />
                            <StatCard title="Losses" value={team.losses} color="text-red-500" />
                            <StatCard title="Points For" value={team.pf} color="text-slate-600" />
                            <StatCard title="Points Against" value={team.pa} color="text-orange-500" />
                        </div>

                        {/* Team Locations */}
                        {team.locations && team.locations.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Team Locations</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {team.locations.map(location => (
                                        <div key={location.id} className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderLeftColor: team.style?.primaryColor || '#dc2626' }}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-grow">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="text-lg font-semibold text-slate-800">{location.name}</h3>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            location.type === 'field' ? 'bg-green-100 text-green-800' :
                                                            location.type === 'stadium' ? 'bg-blue-100 text-blue-800' :
                                                            location.type === 'gym' ? 'bg-orange-100 text-orange-800' :
                                                            location.type === 'training' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-slate-100 text-slate-800'
                                                        }`}>
                                                            {location.type}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-start space-x-2 text-slate-600 mb-2">
                                                        <MapPin className="mt-0.5 flex-shrink-0" size={16} />
                                                        <button 
                                                            onClick={() => {
                                                                const mapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location.address)}&t=k`;
                                                                window.open(mapsUrl, '_blank');
                                                            }}
                                                            className="text-sm text-left hover:text-blue-600 hover:underline cursor-pointer transition-colors"
                                                            title="Click to open in Google Maps"
                                                        >
                                                            {location.address}
                                                        </button>
                                                    </div>
                                                    {location.description && (
                                                        <p className="text-sm text-slate-500">{location.description}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Team GroupMe Chats - Only visible to players, coaches, and admins */}
                        {currentUser && (currentUser.roles.includes('player') || currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach') || currentUser.roles.includes('admin')) && team.groupMes && team.groupMes.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Team Chat Groups</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {team.groupMes.map(groupMe => (
                                        <div key={groupMe.id} className="bg-white rounded-lg shadow-md p-4 border-l-4" style={{ borderLeftColor: team.style?.primaryColor || '#dc2626' }}>
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0">
                                                    {groupMe.image ? (
                                                        <img 
                                                            src={groupMe.image} 
                                                            alt={groupMe.name}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className={`w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center ${groupMe.image ? 'hidden' : 'flex'}`}
                                                    >
                                                        <MessageSquare className="h-6 w-6 text-blue-600" />
                                                    </div>
                                                </div>
                                                <div className="flex-grow">
                                                    <h3 className="text-lg font-semibold text-slate-800">{groupMe.name}</h3>
                                                    {groupMe.description && (
                                                        <p className="text-sm text-slate-600 mt-1">{groupMe.description}</p>
                                                    )}
                                                    <button 
                                                        onClick={() => window.open(groupMe.url, '_blank')}
                                                        className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors flex items-center"
                                                    >
                                                        <MessageSquare className="mr-1 h-4 w-4" />
                                                        Join Chat
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Roster</h2>
                                {isAuthorizedToManage && (
                                    <div className="flex space-x-3">
                                        <button 
                                            onClick={() => setEditingPlayer({firstName: '', lastName: '', nickname: '', email: '', phone: '', number: '', positions: [], teams: [teamId], photo: '', active: true, handedness: 'Right'})}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
                                        >
                                            <Plus className="mr-2" size={16} />
                                            Add Player
                                        </button>
                                        <button 
                                            onClick={() => setManagePlayersExpanded(!managePlayersExpanded)}
                                            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700 flex items-center text-sm"
                                        >
                                            <Settings className="mr-2" size={16} />
                                            {managePlayersExpanded ? 'Hide' : 'Show'} Management
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Player Management Panel */}
                            {isAuthorizedToManage && managePlayersExpanded && (
                                <div className="bg-white rounded-lg shadow p-6 mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold text-slate-800">Player Management</h3>
                                        <button 
                                            onClick={() => setEditingPlayer({
                                                firstName: '',
                                                lastName: '',
                                                nickname: '',
                                                email: '',
                                                phone: '',
                                                number: '',
                                                positions: [],
                                                teams: [teamId],
                                                photo: '',
                                                active: true,
                                                handedness: 'Right'
                                            })}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                                        >
                                            <Plus size={16} />
                                            <span>Add Player</span>
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {sortedTeamPlayers.map(player => (
                                            <div key={player.id} className={`flex items-center justify-between p-3 border rounded-lg ${!player.active ? 'bg-slate-100 opacity-60' : 'bg-white'}`}>
                                                <div className="flex items-center space-x-3">
                                                    {player.photo && (
                                                        <img src={player.photo} alt={player.firstName} className="w-10 h-10 rounded-full object-cover" />
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-slate-800">
                                                            {player.firstName} {player.lastName} #{player.number}
                                                        </div>
                                                        <div className="text-sm text-slate-600">
                                                            {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                                                            {!player.active && <span className="text-red-600 ml-2">(Inactive)</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button 
                                                        onClick={() => setEditingPlayer(player)}
                                                        className="text-blue-600 hover:text-blue-800 p-1"
                                                        title="Edit Player"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setPlayers(players.map(p => 
                                                                p.id === player.id ? {...p, active: !p.active} : p
                                                            ));
                                                        }}
                                                        className={`p-1 ${player.active ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                                                        title={player.active ? 'Deactivate Player' : 'Activate Player'}
                                                    >
                                                        {player.active ? <UserX size={18} /> : <UserCheck size={18} />}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {sortedTeamPlayers.map(player => 
                                    <PlayerCard 
                                        key={player.id} 
                                        player={player} 
                                        teamStyle={team.style}
                                        onClick={() => handlePlayerClick(player)}
                                    />
                                )}
                            </div>
                        </div>

                        {/* Player Card Modal */}
                        <PlayerCardModal
                            player={selectedPlayer}
                            teamStyle={team.style}
                            teams={teams}
                            isOpen={isPlayerModalOpen}
                            onClose={handleClosePlayerModal}
                        />
                    </div>
                )}
                
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Team Statistics</h2>
                        
                        {/* Team Overview Stats */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-xl font-semibold text-slate-800 mb-4">Season Overview</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">{team.wins || 0}</div>
                                    <div className="text-sm font-medium text-slate-600">Wins</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600">{team.losses || 0}</div>
                                    <div className="text-sm font-medium text-slate-600">Losses</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">{team.pf || 0}</div>
                                    <div className="text-sm font-medium text-slate-600">Goals For</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-orange-600">{team.pa || 0}</div>
                                    <div className="text-sm font-medium text-slate-600">Goals Against</div>
                                </div>
                            </div>
                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-xl font-bold text-slate-700">
                                        {((team.wins || 0) / Math.max((team.wins || 0) + (team.losses || 0), 1) * 100).toFixed(1)}%
                                    </div>
                                    <div className="text-sm text-slate-600">Win Percentage</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-slate-700">
                                        {((team.pf || 0) / Math.max((team.wins || 0) + (team.losses || 0), 1)).toFixed(1)}
                                    </div>
                                    <div className="text-sm text-slate-600">Avg Goals/Game</div>
                                </div>
                                <div>
                                    <div className="text-xl font-bold text-slate-700">
                                        {(team.pf && team.pa) ? ((team.pf - team.pa) > 0 ? '+' : '') + (team.pf - team.pa) : '0'}
                                    </div>
                                    <div className="text-sm text-slate-600">Goal Differential</div>
                                </div>
                            </div>
                        </div>

                        {/* Player Statistics */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-slate-800">Player Statistics</h3>
                                {isAuthorizedToManage && (
                                    <button 
                                        onClick={() => setEditingPlayerStats(true)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm flex items-center"
                                    >
                                        <Edit className="mr-2" size={16} />
                                        Update Stats
                                    </button>
                                )}
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-2 font-semibold text-slate-700">Player</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">#</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">GP</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">W-L</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">Goals</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">Assists</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">Points</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">Shots</th>
                                            <th className="text-center py-3 px-2 font-semibold text-slate-700">Saves</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedTeamPlayers.length > 0 ? sortedTeamPlayers
                                            .filter(player => player.active)
                                            .sort((a, b) => (b.stats?.points || 0) - (a.stats?.points || 0))
                                            .map(player => {
                                                const stats = player.stats || {};
                                                const wins = stats.wins || 0;
                                                const losses = stats.losses || 0;
                                                const goals = stats.goals || 0;
                                                const assists = stats.assists || 0;
                                                const points = goals + assists;
                                                
                                                return (
                                                    <tr key={player.id} className="border-b hover:bg-slate-50">
                                                        <td className="py-3 px-2">
                                                            <div className="flex items-center space-x-2">
                                                                {player.photo && (
                                                                    <img 
                                                                        src={player.photo} 
                                                                        alt={`${player.firstName} ${player.lastName}`}
                                                                        className="w-8 h-8 rounded-full object-cover"
                                                                    />
                                                                )}
                                                                <div>
                                                                    <div className="font-medium text-slate-800">
                                                                        {player.firstName} {player.lastName}
                                                                    </div>
                                                                    <div className="text-xs text-slate-500">
                                                                        {Array.isArray(player.positions) ? player.positions.join(', ') : player.positions}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="text-center py-3 px-2 font-semibold">{player.number}</td>
                                                        <td className="text-center py-3 px-2">{stats.gamesPlayed || 0}</td>
                                                        <td className="text-center py-3 px-2">
                                                            <span className="text-green-600 font-medium">{wins}</span>-<span className="text-red-600 font-medium">{losses}</span>
                                                        </td>
                                                        <td className="text-center py-3 px-2 font-semibold">{goals}</td>
                                                        <td className="text-center py-3 px-2">{assists}</td>
                                                        <td className="text-center py-3 px-2 font-bold text-blue-600">{points}</td>
                                                        <td className="text-center py-3 px-2">{stats.shots || 0}</td>
                                                        <td className="text-center py-3 px-2">
                                                            {player.positions && (Array.isArray(player.positions) ? player.positions.includes('Goalie') : player.positions === 'Goalie') ? (
                                                                <span className="font-semibold text-purple-600">{stats.saves || 0}</span>
                                                            ) : (
                                                                <span className="text-slate-400">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            }) : (
                                            <tr>
                                                <td colSpan="9" className="text-center py-8 text-slate-500">
                                                    No players found for this team
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        
                        {/* Top Performers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-white rounded-lg shadow p-4">
                                <h4 className="text-lg font-semibold text-slate-800 mb-3">Top Scorer</h4>
                                {(() => {
                                    const topScorer = sortedTeamPlayers
                                        .filter(p => p.active && p.stats)
                                        .sort((a, b) => ((b.stats?.goals || 0) + (b.stats?.assists || 0)) - ((a.stats?.goals || 0) + (a.stats?.assists || 0)))[0];
                                    
                                    return topScorer ? (
                                        <div className="flex items-center space-x-3">
                                            {topScorer.photo && (
                                                <img src={topScorer.photo} alt={topScorer.firstName} className="w-12 h-12 rounded-full object-cover" />
                                            )}
                                            <div>
                                                <div className="font-semibold">{topScorer.firstName} {topScorer.lastName}</div>
                                                <div className="text-sm text-slate-600">#{topScorer.number}</div>
                                                <div className="text-lg font-bold text-blue-600">
                                                    {(topScorer.stats?.goals || 0) + (topScorer.stats?.assists || 0)} pts
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">No statistics available</div>
                                    );
                                })()}
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-4">
                                <h4 className="text-lg font-semibold text-slate-800 mb-3">Top Goalie</h4>
                                {(() => {
                                    const topGoalie = sortedTeamPlayers
                                        .filter(p => p.active && p.positions && 
                                               (Array.isArray(p.positions) ? p.positions.includes('Goalie') : p.positions === 'Goalie'))
                                        .sort((a, b) => (b.stats?.saves || 0) - (a.stats?.saves || 0))[0];
                                    
                                    return topGoalie ? (
                                        <div className="flex items-center space-x-3">
                                            {topGoalie.photo && (
                                                <img src={topGoalie.photo} alt={topGoalie.firstName} className="w-12 h-12 rounded-full object-cover" />
                                            )}
                                            <div>
                                                <div className="font-semibold">{topGoalie.firstName} {topGoalie.lastName}</div>
                                                <div className="text-sm text-slate-600">#{topGoalie.number}</div>
                                                <div className="text-lg font-bold text-purple-600">
                                                    {topGoalie.stats?.saves || 0} saves
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">No goalies found</div>
                                    );
                                })()}
                            </div>
                            
                            <div className="bg-white rounded-lg shadow p-4">
                                <h4 className="text-lg font-semibold text-slate-800 mb-3">Most Active</h4>
                                {(() => {
                                    const mostActive = sortedTeamPlayers
                                        .filter(p => p.active && p.stats)
                                        .sort((a, b) => (b.stats?.gamesPlayed || 0) - (a.stats?.gamesPlayed || 0))[0];
                                    
                                    return mostActive ? (
                                        <div className="flex items-center space-x-3">
                                            {mostActive.photo && (
                                                <img src={mostActive.photo} alt={mostActive.firstName} className="w-12 h-12 rounded-full object-cover" />
                                            )}
                                            <div>
                                                <div className="font-semibold">{mostActive.firstName} {mostActive.lastName}</div>
                                                <div className="text-sm text-slate-600">#{mostActive.number}</div>
                                                <div className="text-lg font-bold text-green-600">
                                                    {mostActive.stats?.gamesPlayed || 0} games
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-slate-500">No statistics available</div>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                )}
                
                {activeTab === 'schedule' && (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Schedule</h2>
                            {isAuthorizedToManage && (
                                <div className="flex space-x-3">
                                    <button 
                                        onClick={() => setManageScheduleExpanded(!manageScheduleExpanded)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
                                    >
                                        <Settings className="mr-2" size={16} />
                                        {manageScheduleExpanded ? 'Hide' : 'Show'} Schedule Management
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Schedule Management Panel */}
                        {isAuthorizedToManage && manageScheduleExpanded && (
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <h3 className="text-xl font-semibold text-slate-800 mb-4">Schedule & Event Management</h3>
                                <TeamCalendarManager team={team} teams={teams} setTeams={setTeams} websiteStyle={websiteStyle} />
                            </div>
                        )}
                        
                        {/* Team Calendar Events */}
                        {team.calendar && team.calendar.length > 0 && (
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-slate-700 pb-2 border-b-2 border-blue-600">
                                        Team Events
                                    </h2>
                                </div>
                                
                                {/* Event Type Filters for Team Schedule */}
                                <div className="mb-4 bg-slate-50 p-4 rounded-lg">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Show/Hide Event Types</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(new Set(team.calendar.map(event => event.type || 'other'))).sort().map(eventType => {
                                            const isEnabled = teamEventTypeFilters[eventType];
                                            const eventTypeColors = {
                                                game: 'bg-red-100 text-red-800 border-red-200',
                                                practice: 'bg-blue-100 text-blue-800 border-blue-200',
                                                tournament: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                                                meeting: 'bg-purple-100 text-purple-800 border-purple-200',
                                                social: 'bg-green-100 text-green-800 border-green-200',
                                                other: 'bg-slate-100 text-slate-800 border-slate-200'
                                            };
                                            
                                            return (
                                                <button
                                                    key={eventType}
                                                    onClick={() => handleTeamEventTypeToggle(eventType)}
                                                    className={`px-2 py-1 rounded border text-xs font-medium transition-all ${
                                                        isEnabled 
                                                            ? eventTypeColors[eventType] || eventTypeColors.other
                                                            : 'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
                                                    }`}
                                                    title={`${isEnabled ? 'Hide' : 'Show'} ${eventType} events`}
                                                >
                                                    {isEnabled ? '✓' : '✗'} {eventType.charAt(0).toUpperCase() + eventType.slice(1)}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {team.calendar.filter(event => teamEventTypeFilters[event.type || 'other']).map(event => {
                                        if (event.type === 'tournament') {
                                            // Tournament event - show as summary card
                                            return (
                                                <div key={event.id} className="bg-yellow-50 p-4 rounded-lg shadow-sm border border-yellow-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-grow">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Trophy className="text-yellow-600" size={16} />
                                                                <h3 className="font-bold text-slate-800">{event.title}</h3>
                                                            </div>
                                                            <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                                                <span className="flex items-center">
                                                                    <Calendar className="mr-1 h-4 w-4"/>
                                                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    {event.time}
                                                                </span>
                                                                {event.location && (
                                                                    <ClickableLocation 
                                                                        locationName={event.location}
                                                                        teams={teams}
                                                                        className="flex items-center"
                                                                    >
                                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                                        {event.location}
                                                                    </ClickableLocation>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 text-sm">
                                                                <span className="text-slate-700 font-medium">{team.name} participating in this tournament</span>
                                                            </div>
                                                            {event.description && (
                                                                <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center ml-4">
                                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                                                TOURNAMENT
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {event.imageUrl && (
                                                        <div className="mt-3">
                                                            <img src={event.imageUrl} alt="Event" className="w-full h-32 object-cover rounded-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        } else {
                                            // Regular event
                                            return (
                                                <div key={event.id} className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-grow">
                                                            <h3 className="font-bold text-slate-800">{event.title}</h3>
                                                            <div className="flex items-center space-x-4 text-sm text-slate-600 mt-1">
                                                                <span className="flex items-center">
                                                                    <Calendar className="mr-1 h-4 w-4"/>
                                                                    {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                                                </span>
                                                                <span className="flex items-center">
                                                                    {event.time}
                                                                </span>
                                                                {event.location && (
                                                                    <ClickableLocation 
                                                                        locationName={event.location}
                                                                        teams={teams}
                                                                        className="flex items-center"
                                                                    >
                                                                        <MapPin className="mr-1 h-4 w-4"/>
                                                                        {event.location}
                                                                    </ClickableLocation>
                                                                )}
                                                            </div>
                                                            {event.description && (
                                                                <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center ml-4">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                event.type === 'game' ? 'bg-red-100 text-red-800' :
                                                                event.type === 'practice' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-slate-100 text-slate-800'
                                                            }`}>
                                                                {event.type}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {event.imageUrl && (
                                                        <div className="mt-3">
                                                            <img src={event.imageUrl} alt="Event" className="w-full h-32 object-cover rounded-lg" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }
                                    })}
                                </div>
                            </div>
                        )}

                        {/* League Games */}
                        {teamSchedule.map(day => (
                            <div key={day.date}>
                                <h2 className="text-xl font-semibold text-slate-700 pb-2 border-b-2 border-red-800 mb-3">
                                    Past Events - {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                                </h2>
                                <div className="space-y-4">
                                    {day.games.map((game) => {
                                        const home = getTeam(game.home);
                                        const away = getTeam(game.away);
                                        if (!home || !away) return null;
                                        return (
                                            <div key={game.id} className="relative bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
                                                 onClick={() => {
                                                     // Open game details modal or navigate to game details
                                                     console.log('Game details for:', game);
                                                 }}
                                            >
                                                {/* Admin Edit Button Overlay */}
                                                {currentUser && hasPermission(currentUser, 'system.admin_access') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Open game edit modal
                                                            console.log('Edit game:', game);
                                                        }}
                                                        className="absolute top-2 right-2 bg-blue-600 bg-opacity-80 hover:bg-opacity-100 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                                        title="Edit game details"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="text-center w-32">
                                                            <img src={away.logo} alt={away.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1 object-contain"/>
                                                            <p className="font-bold text-sm mt-1">{away.name}</p>
                                                        </div>
                                                        <span className="text-2xl font-bold text-slate-400 mx-4">@</span>
                                                        <div className="text-center w-32">
                                                            <img src={home.logo} alt={home.name} className="w-16 h-16 mx-auto rounded-full bg-slate-200 p-1 object-contain"/>
                                                            <p className="font-bold text-sm mt-1">{home.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-lg">{game.time}</p>
                                                        <p className="text-sm text-slate-500">{game.location}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'media' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Media Gallery</h2>
                            {isAuthorizedToManage && (
                                <button 
                                    onClick={() => setManageMediaExpanded(!manageMediaExpanded)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
                                >
                                    <Settings className="mr-2" size={16} />
                                    {manageMediaExpanded ? 'Hide' : 'Show'} Media Management
                                </button>
                            )}
                        </div>
                        
                        {/* Media Management Panel */}
                        {isAuthorizedToManage && manageMediaExpanded && (
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <MediaManager team={team} setTeams={setTeams} />
                            </div>
                        )}
                        
                        {/* Display galleries and their items */}
                        {team.galleries && team.galleries.length > 0 ? (
                            <div className="space-y-8">
                                {team.galleries.map(gallery => (
                                    <div key={gallery.id}>
                                        <div className="mb-4">
                                            <h3 className="text-xl font-semibold text-slate-700 mb-2">{gallery.name}</h3>
                                            {gallery.description && (
                                                <p className="text-slate-600 text-sm mb-3">{gallery.description}</p>
                                            )}
                                        </div>
                                        
                                        {gallery.items && gallery.items.length > 0 ? (
                                            <div className="relative group">
                                                {/* Navigation Arrows */}
                                                {gallery.items.length > 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => {
                                                                const container = document.getElementById(`gallery-${gallery.id}`);
                                                                if (container) {
                                                                    container.style.animationPlayState = 'paused';
                                                                    const currentTransform = container.style.transform || 'translateX(0px)';
                                                                    const currentX = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
                                                                    const newX = Math.min(currentX + 296, 0);
                                                                    container.style.transform = `translateX(${newX}px)`;
                                                                }
                                                            }}
                                                            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-blue-600 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                                                            title="Previous image"
                                                        >
                                                            <ChevronLeft size={20} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                const container = document.getElementById(`gallery-${gallery.id}`);
                                                                if (container) {
                                                                    container.style.animationPlayState = 'paused';
                                                                    const currentTransform = container.style.transform || 'translateX(0px)';
                                                                    const currentX = parseInt(currentTransform.match(/-?\d+/) || [0])[0];
                                                                    const maxX = -(gallery.items.length * 296);
                                                                    const newX = currentX - 296;
                                                                    container.style.transform = `translateX(${newX >= maxX ? newX : 0}px)`;
                                                                }
                                                            }}
                                                            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-blue-600 bg-opacity-80 text-white p-2 rounded-full hover:bg-opacity-100 transition-all shadow-lg"
                                                            title="Next image"
                                                        >
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </>
                                                )}
                                                
                                                {/* Auto-Scrolling Gallery Container */}
                                                <div className="overflow-hidden w-full" style={{minHeight: '320px'}}>
                                                    <div 
                                                        id={`gallery-${gallery.id}`}
                                                        className="flex gallery-auto-scroll"
                                                        style={{
                                                            gap: '16px',
                                                            width: `${(gallery.items.length * 2) * 296}px`, // 280px + 16px gap per item
                                                            animation: gallery.items.length > 1 ? `gallery-scroll-${gallery.id} 15s linear infinite` : 'none'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.target.style.animationPlayState = 'paused';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.target.style.animationPlayState = 'running';
                                                        }}
                                                    >
                                                        {/* Duplicate items for seamless scrolling - no gaps */}
                                                        {[...gallery.items, ...gallery.items].map((item, index) => (
                                                            <div key={`${item.id}-${index}`} className="flex-shrink-0 bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" style={{width: '280px', marginRight: '16px'}}>
                                                                {gallery.type === 'photo' ? (
                                                                    <div 
                                                                        className="aspect-square overflow-hidden relative group"
                                                                        onClick={() => setSelectedImagePopup({
                                                                            url: item.url,
                                                                            caption: item.caption,
                                                                            galleryName: gallery.name
                                                                        })}
                                                                    >
                                                                        <img 
                                                                            src={item.url} 
                                                                            alt={item.caption || gallery.name}
                                                                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                                                                        />
                                                                        {/* Hover overlay */}
                                                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                                                                            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Eye size={32} />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="aspect-video">
                                                                        <iframe 
                                                                            src={item.url} 
                                                                            title={item.caption || gallery.name}
                                                                            frameBorder="0" 
                                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                                                            allowFullScreen 
                                                                            className="w-full h-full"
                                                                        />
                                                                    </div>
                                                                )}
                                                                {item.caption && (
                                                                    <div className="p-3">
                                                                        <p className="text-slate-600 text-sm line-clamp-2">{item.caption}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                
                                                {/* Gallery Controls */}
                                                <div className="flex justify-center items-center mt-4 space-x-4">
                                                    <button
                                                        onClick={(e) => {
                                                            const container = document.getElementById(`gallery-${gallery.id}`);
                                                            if (container) {
                                                                const currentState = window.getComputedStyle(container).animationPlayState;
                                                                if (currentState === 'paused') {
                                                                    container.style.animationPlayState = 'running';
                                                                    e.target.innerHTML = '⏸️ Pause';
                                                                    e.target.className = 'bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors';
                                                                } else {
                                                                    container.style.animationPlayState = 'paused';
                                                                    e.target.innerHTML = '▶️ Play';
                                                                    e.target.className = 'bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors';
                                                                }
                                                            }
                                                        }}
                                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                                    >
                                                        ⏸️ Pause
                                                    </button>
                                                    <div className="flex space-x-1">
                                                        {gallery.items.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                onClick={() => {
                                                                    const container = document.getElementById(`gallery-${gallery.id}`);
                                                                    if (container) {
                                                                        container.style.transform = `translateX(-${index * 296}px)`;
                                                                        container.style.animationPlayState = 'paused';
                                                                    }
                                                                }}
                                                                className="w-3 h-3 bg-slate-300 hover:bg-slate-500 rounded-full transition-colors"
                                                                title={`Go to image ${index + 1}`}
                                                            ></button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 bg-slate-50 rounded-lg">
                                                <ImageIcon className="mx-auto h-12 w-12 text-slate-400 mb-2"/>
                                                <p className="text-slate-500">No {gallery.type}s in this gallery yet.</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <ImageIcon className="mx-auto h-16 w-16 text-slate-400 mb-4"/>
                                <h3 className="text-xl font-semibold text-slate-600 mb-2">No Media Galleries Yet</h3>
                                <p className="text-slate-500 mb-4">Team administrators can create photo and video galleries to showcase the team's memories and highlights.</p>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'social' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Social Media & Communication</h2>
                            {isAuthorizedToManage && (
                                <button 
                                    onClick={() => setManageSocialExpanded(!manageSocialExpanded)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
                                >
                                    <Settings className="mr-2" size={16} />
                                    {manageSocialExpanded ? 'Hide' : 'Show'} Social Management
                                </button>
                            )}
                        </div>
                        
                        <div className="max-w-2xl mx-auto mb-6">
                            <SocialCard entity={team} />
                        </div>
                        
                        {/* Social Media Management Panel */}
                        {isAuthorizedToManage && manageSocialExpanded && (
                            <div className="space-y-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-xl font-semibold text-slate-800 mb-4">Social Media Settings</h3>
                                    <TeamSocialMediaManager team={team} setTeams={setTeams} />
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'groupme' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">GroupMe Chats</h2>
                        </div>
                        
                        {/* Display GroupMe Chats */}
                        <div className="space-y-4 mb-6">
                            {team.groupMe?.chats && team.groupMe.chats.length > 0 ? (
                                team.groupMe.chats.map((chat, index) => (
                                    <div key={index} className="bg-white rounded-lg shadow p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-4">
                                                {chat.logoUrl && (
                                                    <img 
                                                        src={chat.logoUrl} 
                                                        alt={`${chat.name} logo`} 
                                                        className="w-12 h-12 rounded-lg object-contain bg-white" 
                                                    />
                                                )}
                                                <div>
                                                    <h3 className="text-xl font-semibold text-slate-800">{chat.name}</h3>
                                                    <p className="text-sm text-slate-600">{chat.description}</p>
                                                </div>
                                            </div>
                                            {chat.qrCode && (
                                                <div className="text-center">
                                                    <img src={chat.qrCode} alt="QR Code" className="w-16 h-16 mx-auto mb-2" />
                                                    <p className="text-xs text-slate-500">Scan to Join</p>
                                                </div>
                                            )}
                                        </div>
                                        {chat.inviteLink && (
                                            <a 
                                                href={chat.inviteLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                                            >
                                                Join Chat
                                            </a>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="bg-white rounded-lg shadow p-6 text-center">
                                    <p className="text-slate-500">No GroupMe chats available yet.</p>
                                </div>
                            )}
                        </div>
                        
                        {/* GroupMe Management Panel */}
                        {isAuthorizedToManage && (
                            <div className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-xl font-semibold text-slate-800 mb-4">GroupMe Chat Management</h3>
                                <GroupMeManager team={team} setTeams={setTeams} />
                            </div>
                        )}
                    </div>
                )}
                
                {activeTab === 'contact' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Team Contact Information</h2>
                            {isAuthorizedToManage && (
                                <button 
                                    onClick={() => setManageContactExpanded(!manageContactExpanded)}
                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center text-sm"
                                >
                                    <Settings className="mr-2" size={16} />
                                    {manageContactExpanded ? 'Hide' : 'Show'} Contact Management
                                </button>
                            )}
                        </div>
                        
                        <div className="max-w-2xl mx-auto">
                            <ContactCard entity={team} />
                        </div>
                        
                        {/* Contact Management Panel */}
                        {isAuthorizedToManage && manageContactExpanded && (
                            <div className="bg-white rounded-lg shadow p-6 mt-6">
                                <h3 className="text-xl font-semibold text-slate-800 mb-4">Team Information Management</h3>
                                <TeamInfoManager team={team} setTeams={setTeams} />
                            </div>
                        )}
                    </div>
                )}
                
                {/* TEAM STYLE MANAGEMENT TAB - For team admins to customize their team */}
                {isAuthorizedToManage && activeTab === 'teamstyle' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Team Style & Customization</h2>
                        <div className="bg-white rounded-lg shadow p-6">
                            <TeamStyleManager teams={teams} setTeams={setTeams} currentUser={currentUser} />
                        </div>
                    </div>
                )}
                
                {/* FRIENDS TAB - Display team friends and partners */}
                {activeTab === 'friends' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Friends & Partners</h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {friends.length === 0 ? (
                                <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                    <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No Friends Yet</h3>
                                    <p className="text-slate-500">Check back later to see our friends and community partners</p>
                                </div>
                            ) : (
                                friends.map(friend => (
                                    <div key={friend.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="text-center">
                                            <img 
                                                src={friend.photo || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=FRIEND'} 
                                                alt={friend.name} 
                                                className="w-20 h-20 mx-auto rounded-full object-contain bg-slate-50 p-1"
                                            />
                                            <h3 className="font-semibold text-slate-800 mt-3">{friend.name}</h3>
                                            {friend.description && (
                                                <p className="text-sm text-slate-600 mt-1">{friend.description}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-center gap-2 mt-4">
                                            {friend.website && (
                                                <a 
                                                    href={friend.website} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-700 p-1"
                                                    title="Visit website"
                                                >
                                                    <Globe size={18} />
                                                </a>
                                            )}
                                            {friend.socialMedia?.twitter && (
                                                <a 
                                                    href={`https://twitter.com/${friend.socialMedia.twitter.replace('@', '')}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-400 hover:text-blue-600 p-1"
                                                    title="Twitter"
                                                >
                                                    <Twitter size={18} />
                                                </a>
                                            )}
                                            {friend.socialMedia?.facebook && (
                                                <a 
                                                    href={friend.socialMedia.facebook.startsWith('http') ? friend.socialMedia.facebook : `https://facebook.com/${friend.socialMedia.facebook}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 p-1"
                                                    title="Facebook"
                                                >
                                                    <Facebook size={18} />
                                                </a>
                                            )}
                                            {friend.socialMedia?.instagram && (
                                                <a 
                                                    href={`https://instagram.com/${friend.socialMedia.instagram.replace('@', '')}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-pink-500 hover:text-pink-700 p-1"
                                                    title="Instagram"
                                                >
                                                    <Instagram size={18} />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                
                {/* SPONSORS TAB - Display team sponsors */}
                {activeTab === 'sponsors' && (
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-slate-800 mb-6 tracking-tight">Sponsors & Supporters</h2>
                        
                        {sponsors.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                                <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                                <h3 className="text-lg font-semibold text-slate-600 mb-2">No Sponsors Yet</h3>
                                <p className="text-slate-500">Check back later to see our amazing sponsors and supporters</p>
                            </div>
                        ) : (
                            ['Platinum', 'Gold', 'Silver', 'Bronze'].map(tier => {
                                const tierSponsors = sponsors.filter(s => s.tier === tier);
                                return tierSponsors.length > 0 && (
                                    <div key={tier} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-xl font-semibold text-slate-800">{tier} Sponsors</h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                                'bg-orange-100 text-orange-800'
                                            }`}>
                                                {tierSponsors.length} {tierSponsors.length === 1 ? 'Sponsor' : 'Sponsors'}
                                            </span>
                                        </div>
                                        
                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                            {tierSponsors.map(sponsor => (
                                                <div key={sponsor.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                                    <div className="text-center">
                                                        <img 
                                                            src={sponsor.logo || 'https://placehold.co/120x80/f1f5f9/64748b?text=SPONSOR'} 
                                                            alt={sponsor.name} 
                                                            className="w-24 h-16 mx-auto rounded object-contain bg-slate-50 p-1"
                                                        />
                                                        <h4 className="font-semibold text-slate-800 mt-3">{sponsor.name}</h4>
                                                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                                                            sponsor.tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                            sponsor.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                            sponsor.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-orange-100 text-orange-800'
                                                        }`}>
                                                            {sponsor.tier}
                                                        </span>
                                                        {sponsor.description && (
                                                            <p className="text-sm text-slate-600 mt-2">{sponsor.description}</p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="flex justify-center gap-2 mt-4">
                                                        {sponsor.website && (
                                                            <a 
                                                                href={sponsor.website} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-500 hover:text-blue-700 p-1"
                                                                title="Visit website"
                                                            >
                                                                <Globe size={18} />
                                                            </a>
                                                        )}
                                                        {sponsor.socialMedia?.twitter && (
                                                            <a 
                                                                href={`https://twitter.com/${sponsor.socialMedia.twitter.replace('@', '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-400 hover:text-blue-600 p-1"
                                                                title="Twitter"
                                                            >
                                                                <Twitter size={18} />
                                                            </a>
                                                        )}
                                                        {sponsor.socialMedia?.facebook && (
                                                            <a 
                                                                href={sponsor.socialMedia.facebook.startsWith('http') ? sponsor.socialMedia.facebook : `https://facebook.com/${sponsor.socialMedia.facebook}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                                title="Facebook"
                                                            >
                                                                <Facebook size={18} />
                                                            </a>
                                                        )}
                                                        {sponsor.socialMedia?.instagram && (
                                                            <a 
                                                                href={`https://instagram.com/${sponsor.socialMedia.instagram.replace('@', '')}`} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-pink-500 hover:text-pink-700 p-1"
                                                                title="Instagram"
                                                            >
                                                                <Instagram size={18} />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
            </div>
            
            {/* Image Popup Modal */}
            {selectedImagePopup && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedImagePopup(null)}
                >
                    <div className="relative max-w-[90vw] max-h-[90vh]">
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedImagePopup(null)}
                            className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 z-10"
                        >
                            <X size={24} />
                        </button>
                        
                        {/* Image */}
                        <img 
                            src={selectedImagePopup.url} 
                            alt={selectedImagePopup.caption}
                            className="max-w-full max-h-full object-contain cursor-pointer"
                            onClick={() => setSelectedImagePopup(null)}
                        />
                        
                        {/* Caption */}
                        {selectedImagePopup.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4">
                                <h3 className="text-lg font-semibold">{selectedImagePopup.galleryName}</h3>
                                <p className="text-sm text-gray-300">{selectedImagePopup.caption}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {/* Player Form Modal */}
            {editingPlayer && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold text-slate-800">
                                    {editingPlayer?.id ? 'Edit Player' : 'Add New Player'}
                                </h3>
                                <button 
                                    onClick={() => setEditingPlayer(null)}
                                    className="text-slate-400 hover:text-slate-600 p-2"
                                >
                                    <X size={24} />
                                </button>
                            </div>
                            
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                if (editingPlayer.id) {
                                    setPlayers(players.map(p => p.id === editingPlayer.id ? editingPlayer : p));
                                } else {
                                    setPlayers([...players, { ...editingPlayer, id: Date.now() }]);
                                }
                                setEditingPlayer(null);
                            }} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
                                        <input 
                                            type="text" 
                                            value={editingPlayer.firstName || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, firstName: e.target.value})} 
                                            className="w-full p-2 border rounded-md" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
                                        <input 
                                            type="text" 
                                            value={editingPlayer.lastName || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, lastName: e.target.value})} 
                                            className="w-full p-2 border rounded-md" 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nickname</label>
                                        <input 
                                            type="text" 
                                            value={editingPlayer.nickname || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, nickname: e.target.value})} 
                                            className="w-full p-2 border rounded-md" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Jersey Number</label>
                                        <input 
                                            type="text" 
                                            value={editingPlayer.number || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, number: e.target.value})} 
                                            className="w-full p-2 border rounded-md" 
                                            required 
                                        />
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Positions</label>
                                        <select 
                                            value={Array.isArray(editingPlayer.positions) ? editingPlayer.positions[0] || '' : editingPlayer.positions || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, positions: [e.target.value]})} 
                                            className="w-full p-2 border rounded-md" 
                                            required
                                        >
                                            <option value="">Select Position</option>
                                            <option value="Attack">Attack</option>
                                            <option value="Midfield">Midfield</option>
                                            <option value="Defense">Defense</option>
                                            <option value="Goalie">Goalie</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Handedness</label>
                                        <select 
                                            value={editingPlayer.handedness || 'Right'} 
                                            onChange={e => setEditingPlayer({...editingPlayer, handedness: e.target.value})} 
                                            className="w-full p-2 border rounded-md"
                                        >
                                            <option value="Right">Right</option>
                                            <option value="Left">Left</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                        <input 
                                            type="email" 
                                            value={editingPlayer.email || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, email: e.target.value})} 
                                            className="w-full p-2 border rounded-md" 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                        <input 
                                            type="tel" 
                                            value={editingPlayer.phone || ''} 
                                            onChange={e => setEditingPlayer({...editingPlayer, phone: e.target.value})} 
                                            className="w-full p-2 border rounded-md" 
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <FileUploadInput
                                        label="Player Photo"
                                        accept="image/*"
                                        currentValue={editingPlayer.photo || ''}
                                        onChange={(url) => setEditingPlayer({...editingPlayer, photo: url})}
                                        placeholder="Upload player photo"
                                        enableCrop={false}
                                        cropAspectRatio="1:1"
                                    />
                                </div>
                                
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={editingPlayer.active !== false}
                                        onChange={e => setEditingPlayer({...editingPlayer, active: e.target.checked})}
                                        className="rounded mr-2"
                                    />
                                    <label className="text-sm font-medium text-slate-700">Active Player</label>
                                </div>
                                
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button 
                                        type="button" 
                                        onClick={() => setEditingPlayer(null)} 
                                        className="bg-slate-500 text-white px-6 py-2 rounded-md hover:bg-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                                    >
                                        {editingPlayer?.id ? 'Update Player' : 'Add Player'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChatPage = ({ currentUser }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: 'Welcome to the league chat!', displayName: 'System', timestamp: new Date() },
        { id: 2, text: 'Great game last weekend!', displayName: 'Coach Mike', timestamp: new Date() }
    ]);
    const [newMessage, setNewMessage] = useState('');
    const [channel, setChannel] = useState('league');
    const messagesEndRef = useRef(null);
    
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

    // Memoized handlers to prevent re-renders
    const handleMessageChange = useCallback((e) => {
        setNewMessage(e.target.value);
    }, []);

    const handleSendMessage = useCallback(async (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !currentUser) return;
        
        const message = {
            id: Date.now(),
            text: newMessage,
            timestamp: new Date(),
            displayName: currentUser.name,
            uid: currentUser.id
        };
        
        setMessages(prev => [...prev, message]);
        setNewMessage('');
    }, [newMessage, currentUser, setMessages]);

    return (
        <div className="p-4 md:p-8 flex flex-col h-full">
            <h1 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">League Chat</h1>
            <div className="flex border rounded-lg shadow-md bg-white flex-grow">
                <div className="w-1/4 border-r bg-slate-50">
                    <div className="p-4 font-bold text-lg border-b">Channels</div>
                    <ul>
                        {['league', 'falcons', 'bears'].map(ch => (
                            <li key={ch} className={`p-4 cursor-pointer hover:bg-slate-200 ${channel === ch ? 'bg-red-100 font-semibold' : ''}`} onClick={() => setChannel(ch)}>
                                # {ch.charAt(0).toUpperCase() + ch.slice(1)}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="w-3/4 flex flex-col">
                    <div className="flex-grow p-4 overflow-y-auto">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex mb-4 ${msg.uid === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-md p-3 rounded-lg ${msg.uid === currentUser?.id ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
                                    <p className="font-bold text-sm">{msg.displayName}</p>
                                    <p>{msg.text}</p>
                                    <p className="text-xs opacity-75 mt-1 text-right">{msg.timestamp.toLocaleTimeString()}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 bg-slate-100 border-t">
                        <form onSubmit={handleSendMessage} className="flex">
                            <input type="text" value={newMessage} onChange={handleMessageChange} placeholder={`Message in #${channel}`} className="flex-grow border rounded-l-lg p-2 focus:outline-none focus:ring-2 focus:ring-red-800" />
                            <button type="submit" className="bg-red-800 text-white px-4 rounded-r-lg hover:bg-red-900">Send</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- ADMIN COMPONENTS ---
const PlayerForm = ({ initialPlayer, onSave, onCancel, managedTeams, isAdmin }) => {
    const [player, setPlayer] = useState(initialPlayer);
    
    // Memoized handlers to prevent re-renders
    const handleChange = useCallback((e) => {
        const { name, value, type, checked } = e.target;
        setPlayer(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    }, []);
    
    const handlePositionChange = useCallback((e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setPlayer(prev => ({ ...prev, positions: selectedOptions }));
    }, []);

    const handleTeamChange = useCallback((e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setPlayer(prev => ({ ...prev, teams: selectedOptions }));
    }, []);
    
    const handlePhotoChange = useCallback((e) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setPlayer(prev => ({...prev, photo: fileUrl}));
        }
    }, []);
    
    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        onSave(player);
    }, [player, onSave]);
    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
                <h3 className="text-2xl font-bold mb-4">{player?.id ? 'Edit Player' : 'Add New Player'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="firstName" value={player.firstName || ''} onChange={handleChange} placeholder="First Name" className="w-full p-2 border rounded" required />
                        <input type="text" name="lastName" value={player.lastName || ''} onChange={handleChange} placeholder="Last Name" className="w-full p-2 border rounded" required />
                        <input type="text" name="nickname" value={player.nickname || ''} onChange={handleChange} placeholder="Nickname" className="w-full p-2 border rounded" />
                        <input type="email" name="email" value={player.email || ''} onChange={handleChange} placeholder="Email" className="w-full p-2 border rounded" />
                        <input type="tel" name="phone" value={player.phone || ''} onChange={handleChange} placeholder="Cell Phone" className="w-full p-2 border rounded" />
                        <input type="number" name="number" value={player.number || ''} onChange={handleChange} placeholder="Player #" className="w-full p-2 border rounded" />
                        {isAdmin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Team(s)</label>
                                <select multiple name="teams" value={player.teams || []} onChange={handleTeamChange} className="w-full p-2 border rounded h-24" required>
                                    {managedTeams.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Position(s)</label>
                            <select multiple value={player.positions || []} onChange={handlePositionChange} className="w-full p-2 border rounded h-24" required>
                                <option>Attack</option><option>Middie</option><option>Defense</option><option>Goalie</option>
                            </select>
                             <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Handedness</label>
                            <select name="handedness" value={player.handedness || 'Right'} onChange={handleChange} className="w-full p-2 border rounded" required>
                                <option value="Right">Right Handed</option>
                                <option value="Left">Left Handed</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <FileUploadInput
                            label="Player Photo"
                            accept="image/*"
                            currentValue={player.photo || ''}
                            onChange={(url) => setPlayer(prev => ({...prev, photo: url}))}
                            placeholder="Upload player photo"
                            enableCrop={false}
                            cropAspectRatio="1:1"
                        />
                    </div>
                    <div className="flex items-center">
                        <input type="checkbox" name="active" id="active" checked={player.active} onChange={handleChange} className="h-4 w-4 text-red-600 border-gray-300 rounded focus:ring-red-500" />
                        <label htmlFor="active" className="ml-2 block text-sm text-gray-900">Active</label>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onCancel} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Player</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

const PlayerManager = ({ players, setPlayers, teams, currentUser }) => {
    const [editingPlayer, setEditingPlayer] = useState(null);
    const isAdmin = currentUser.roles.includes('admin');
    
    const managedTeams = isAdmin
        ? teams 
        : teams.filter(t => t.id === currentUser.teamId);
    const [managedTeamId, setManagedTeamId] = useState(isAdmin ? 'all' : currentUser.teamId);

    const handleSave = (playerToSave) => {
        if (playerToSave.id) {
             setPlayers(prevPlayers => prevPlayers.map(p => p.id === playerToSave.id ? playerToSave : p));
        } else {
            const newPlayer = { ...playerToSave, id: Date.now() };
            setPlayers(prevPlayers => [...prevPlayers, newPlayer]);
        }
        setEditingPlayer(null);
    };
    const teamRoster = managedTeamId === 'all' 
        ? players 
        : players.filter(p => p.teams.includes(managedTeamId));
    return (
        <div>
            {editingPlayer && <PlayerForm 
                initialPlayer={editingPlayer} 
                onSave={handleSave} 
                onCancel={() => setEditingPlayer(null)} 
                managedTeams={managedTeams} 
                isAdmin={isAdmin}
            />}
            <div className="flex justify-between items-center mb-4">
                <div>
                    <label htmlFor="team-select" className="mr-2 font-semibold">Manage Roster for:</label>
                    <select id="team-select" value={managedTeamId} onChange={e => setManagedTeamId(e.target.value)} className="p-2 border rounded-md">
                        {isAdmin && <option value="all">All Players</option>}
                        {managedTeams.filter(t => t.active).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>
                <button onClick={() => setEditingPlayer({firstName: '', lastName: '', nickname: '', email: '', phone: '', number: '', positions: [], teams: [managedTeamId === 'all' ? managedTeams[0].id : managedTeamId], photo: '', active: true, handedness: 'Right'})} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"><Plus className="mr-2 h-4 w-4"/> Add Player</button>
            </div>
            <ul className="mt-4 space-y-2">
                {teamRoster.map(p => (
                    <li key={p.id} className={`flex items-center p-3 border rounded-lg bg-white shadow-sm ${!p.active && 'opacity-50 bg-slate-100'}`}>
                        <span className="flex-grow">{p.firstName} {p.lastName} (#{p.number}) - {Array.isArray(p.positions) ? p.positions.join(', ') : p.positions}</span>
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => setEditingPlayer(p)} className="text-slate-500 hover:text-slate-700 mr-2 p-1"><Edit size={18}/></button>
                            <button className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

// Team form component - moved outside to prevent recreation  
const TeamForm = ({ editingTeam, handleInputChange, handleSave, setEditingTeam, formBackgroundColor = '#ff0000' }) => {
    // Force red background to test if formBackgroundColor is working
    return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div 
            className="p-6 rounded-lg shadow-xl w-full max-w-md"
            style={{ backgroundColor: formBackgroundColor }}
        >
            <h3 className="text-xl font-bold text-slate-800 mb-4">
                {editingTeam?.id ? 'Edit Team' : 'Add Team'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
                <input 
                    type="text" 
                    value={editingTeam?.name || ''} 
                    onChange={e => handleInputChange('name', e.target.value)} 
                    placeholder="Team Name" 
                    className="w-full p-2 border rounded" 
                    required 
                />
                
                <input 
                    type="email" 
                    value={editingTeam?.contactEmail || ''} 
                    onChange={e => handleInputChange('contactEmail', e.target.value)} 
                    placeholder="Contact Email" 
                    className="w-full p-2 border rounded" 
                />
                
                <div className="text-sm text-slate-600 bg-blue-50 p-3 rounded">
                    <strong>Team Logo:</strong> Configure your team logo in the Team Style settings after saving this team.
                </div>

                <div className="flex space-x-2">
                    <button type="submit" className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                        Save Team
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setEditingTeam(null)} 
                        className="flex-1 bg-slate-500 text-white py-2 px-4 rounded hover:bg-slate-600"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    </div>
    );
};

const TeamManager = ({ teams, setTeams, websiteStyle }) => {
    const [editingTeam, setEditingTeam] = useState(null);
    
    // Get form background color from website style or default
    const formBackgroundColor = websiteStyle?.formBackgroundColor || '#f8fafc';
    
    // Memoized handlers to prevent re-renders
    const handleInputChange = useCallback((field, value) => {
        setEditingTeam(prev => ({...prev, [field]: value}));
    }, []);
    
    const handleSave = useCallback((e) => {
        e.preventDefault();
        if (editingTeam?.id) {
            setTeams(currentTeams => currentTeams.map(t => t.id === editingTeam.id ? editingTeam : t));
        } else {
            // Ensure we have a valid team name before proceeding
            if (!editingTeam?.name || editingTeam.name.trim() === '') {
                alert('Please enter a team name');
                return;
            }
            
            const newTeam = {
                ...editingTeam,
                id: editingTeam.id || editingTeam.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                wins: 0, losses: 0, ties: 0, pf: 0, pa: 0,
                active: true, media: [], calendar: [],
                social: { twitter: '', instagram: '', facebook: '', youtube: '' },
                style: { bannerUrl: '', primaryColor: '#ff0000', backgroundColor: '#fef2f2' }
            };
            setTeams(currentTeams => [...currentTeams, newTeam]);
        }
        setEditingTeam(null);
    }, [editingTeam, setTeams]);
    
    const toggleActive = useCallback((team) => {
        setTeams(currentTeams => currentTeams.map(t => t.id === team.id ? {...t, active: !t.active} : t));
    }, [setTeams]);
    
    // FIX: Add missing delete handler
    const handleDelete = useCallback((team) => {
        if (window.confirm(`Are you sure you want to delete ${team.name}? This action cannot be undone.`)) {
            setTeams(currentTeams => currentTeams.filter(t => t.id !== team.id));
        }
    }, [setTeams]);

    return (
        <div>
            {editingTeam && (
                <TeamForm 
                    editingTeam={editingTeam}
                    handleInputChange={handleInputChange}
                    handleSave={handleSave}
                    setEditingTeam={setEditingTeam}
                    formBackgroundColor={formBackgroundColor}
                />
            )}
            <div className="flex justify-end mb-4">
                <button onClick={() => setEditingTeam({name: '', logo: '', division: 'Field', contactEmail: ''})} className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900 flex items-center"><Plus className="mr-2 h-4 w-4"/> Add Team</button>
            </div>
             <ul className="mt-4 space-y-2">
                {teams.map(t => (
                    <li key={t.id} className={`flex items-center p-3 border rounded-lg bg-white shadow-sm ${!t.active && 'opacity-50 bg-slate-100'}`}>
                        <div className="flex-grow flex items-center gap-3">
                            <img src={t.logo} alt={t.name} className="w-8 h-8 rounded-full bg-white p-1 object-contain" />
                            <span className="font-semibold">{t.name}</span>
                        </div>
                        <div className="flex-shrink-0 ml-4">
                            <button onClick={() => toggleActive(t)} className={`mr-2 p-1 ${t.active ? 'text-green-500' : 'text-slate-500'}`}>
                                {t.active ? <ToggleRight size={22}/> : <ToggleLeft size={22} />}
                            </button>
                            <button onClick={() => setEditingTeam(t)} className="text-slate-500 hover:text-slate-700 mr-2 p-1"><Edit size={18}/></button>
                            <button onClick={() => handleDelete(t)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18}/></button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const ScoreManager = ({ leagueSchedule, gameTickerData, setGameTickerData, teams }) => {
    const [scores, setScores] = useState({});
    
    // Memoized handlers to prevent re-renders
    const handleScoreChange = useCallback((gameId, team, value) => {
        setScores(prev => ({ ...prev, [gameId]: { ...prev[gameId], [team]: value } }));
    }, []);

    const handleSaveScore = useCallback((game) => {
        const gameId = game.id;
        const homeScore = parseInt(scores[gameId]?.home, 10);
        const awayScore = parseInt(scores[gameId]?.away, 10);
        if (isNaN(homeScore) || isNaN(awayScore)) {
            alert("Please enter valid scores for both teams.");
            return;
        }
        
        setGameTickerData(prevData => prevData.map(g => 
            g.id === gameId ? { ...g, homeScore, awayScore, status: 'Final' } : g
        ));
    }, [scores, setGameTickerData]);

    const getTeam = (id) => teams.find(t => t.id === id);
    return (
        <div>
            {leagueSchedule.map(day => (
                <div key={day.date} className="mb-6">
                    <h3 className="text-lg font-semibold text-slate-700 pb-2 border-b mb-3">
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' })}
                    </h3>
                    {day.games.map(game => {
                        const gameData = gameTickerData.find(g => g.id === game.id);
                        const home = getTeam(game.home);
                        const away = getTeam(game.away);
                        if (!home || !away) return null;

                        return (
                            <div key={game.id} className="bg-white p-3 rounded-lg shadow-sm mb-2 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex-grow">
                                    <span className="font-semibold">{home.name}</span> vs <span className="font-semibold">{away.name}</span>
                                    <span className="text-sm text-slate-500 ml-2">({game.location})</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="0" className="w-16 p-1 border rounded text-center" disabled={gameData?.status === 'Final'} defaultValue={gameData?.homeScore} onChange={e => handleScoreChange(game.id, 'home', e.target.value)} />
                                    <span>-</span>
                                    <input type="number" placeholder="0" className="w-16 p-1 border rounded text-center" disabled={gameData?.status === 'Final'} defaultValue={gameData?.awayScore} onChange={e => handleScoreChange(game.id, 'away', e.target.value)} />
                                    {gameData?.status !== 'Final' ? (
                                        <button onClick={() => handleSaveScore(game)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">Save</button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-green-600 px-3">FINAL</span>
                                            <button 
                                                onClick={() => {
                                                    const updatedData = gameTickerData.map(g => 
                                                        g.id === game.id ? { ...g, status: 'Active' } : g
                                                    );
                                                    setGameTickerData(updatedData);
                                                }}
                                                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
                                            >
                                                Edit Score
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

const UserManager = ({ users, setUsers, teams }) => {
    const [editingUser, setEditingUser] = useState(null);
    const [viewTab, setViewTab] = useState('active'); // 'active', 'pending'

    // User approval/rejection handlers
    const handleApproveUser = (userId) => {
        setUsers(users.map(u => {
            if (u.id === userId) {
                const approvedUser = {
                    ...u,
                    status: 'active',
                    roles: [u.preferredRole || 'player'],
                    roleIds: u.preferredRole === 'coach' ? ['team_coach'] : ['player'],
                    approvedAt: new Date().toISOString().split('T')[0]
                };
                return approvedUser;
            }
            return u;
        }));
    };

    const handleRejectUser = (userId) => {
        setUsers(users.filter(u => u.id !== userId));
    };

    const handleSave = (e) => {
        e.preventDefault();
        setUsers(users.map(u => u.id === editingUser.id ? editingUser : u));
        setEditingUser(null);
    };

    const handleRoleChange = (role, checked) => {
        const currentRoles = editingUser.roles || [];
        if (checked) {
            setEditingUser({...editingUser, roles: [...currentRoles, role]});
        } else {
            setEditingUser({...editingUser, roles: currentRoles.filter(r => r !== role)});
        }
    };

    const activeUsers = users.filter(u => u.status === 'active');
    const pendingUsers = users.filter(u => u.status === 'pending');

    const UserForm = () => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={() => setEditingUser(null)}
        >
            <div 
                className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold mb-4">Edit User: {editingUser.name}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block font-semibold mb-2">Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                           {['player', 'coach', 'player/coach', 'admin'].map(role => (
                               <label key={role} className="flex items-center space-x-2">
                                   <input type="checkbox" checked={editingUser.roles.includes(role)} onChange={e => handleRoleChange(role, e.target.checked)} />
                                   <span className="capitalize">{role}</span>
                               </label>
                           ))}
                        </div>
                    </div>
                    <div>
                        <label className="block font-semibold">Team</label>
                        <select value={editingUser.teamId || ''} onChange={e => setEditingUser({...editingUser, teamId: e.target.value})} className="w-full p-2 border rounded">
                            <option value="">(No Team)</option>
                            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={() => setEditingUser(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">Cancel</button>
                        <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );

    return (
        <div>
            {editingUser && <UserForm />}
            
            {/* Tab Navigation */}
            <div className="flex space-x-4 border-b mb-4">
                <button 
                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                        viewTab === 'active' 
                            ? 'border-blue-600 text-blue-600' 
                            : 'border-transparent text-slate-600 hover:text-blue-600'
                    }`}
                    onClick={() => setViewTab('active')}
                >
                    Active Users ({activeUsers.length})
                </button>
                <button 
                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                        viewTab === 'pending' 
                            ? 'border-orange-600 text-orange-600' 
                            : 'border-transparent text-slate-600 hover:text-orange-600'
                    }`}
                    onClick={() => setViewTab('pending')}
                >
                    Pending Approval ({pendingUsers.length})
                </button>
            </div>

            {/* Active Users Tab */}
            {viewTab === 'active' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Active Users</h3>
                    {activeUsers.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">No active users found.</p>
                    ) : (
                        <ul className="space-y-2">
                            {activeUsers.map(user => (
                                <li key={user.id} className="flex items-center p-3 border rounded-lg bg-white shadow-sm">
                                    <div className="flex-grow">
                                        <p className="font-bold">{user.name}</p>
                                        <p className="text-sm text-slate-500">{user.email}</p>
                                        {user.teamId && (
                                            <p className="text-xs text-slate-400">
                                                Team: {teams.find(t => t.id === user.teamId)?.name || 'Unknown'}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex-shrink-0 ml-4 flex items-center gap-4">
                                        <span className={`font-semibold capitalize px-2 py-1 rounded-full text-xs ${user.roles.length > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {user.roles.length > 0 ? user.roles.join(', ') : 'Unassigned'}
                                        </span>
                                        <button onClick={() => setEditingUser(user)} className="text-slate-500 hover:text-slate-700 p-1">
                                            <Edit size={18}/>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Pending Users Tab */}
            {viewTab === 'pending' && (
                <div>
                    <h3 className="text-lg font-semibold mb-4">Pending Approval</h3>
                    {pendingUsers.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <UserCheck size={48} className="mx-auto mb-4" />
                            <p>No pending user requests.</p>
                            <p className="text-sm">New registration requests will appear here.</p>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {pendingUsers.map(user => (
                                <li key={user.id} className="border rounded-lg bg-yellow-50 border-yellow-200 p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-grow">
                                            <h4 className="font-bold text-lg">{user.name}</h4>
                                            <p className="text-slate-600">{user.email}</p>
                                            {user.phone && (
                                                <p className="text-sm text-slate-500">Phone: {user.phone}</p>
                                            )}
                                        </div>
                                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
                                            PENDING
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                                        <div>
                                            <strong>Preferred Role:</strong>
                                            <span className="ml-2 capitalize">{user.preferredRole}</span>
                                        </div>
                                        <div>
                                            <strong>Interested Team:</strong>
                                            <span className="ml-2">
                                                {user.teamId ? teams.find(t => t.id === user.teamId)?.name || 'Unknown' : 'No preference'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {user.reasonForJoining && (
                                        <div className="mb-4">
                                            <strong className="text-sm">Why they want to join:</strong>
                                            <p className="text-sm text-slate-700 bg-white p-2 rounded border mt-1">
                                                {user.reasonForJoining}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-slate-500">
                                            Applied: {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleRejectUser(user.id)}
                                                className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200 transition-colors"
                                            >
                                                Reject
                                            </button>
                                            <button
                                                onClick={() => handleApproveUser(user.id)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                            >
                                                Approve as {user.preferredRole}
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

const TeamStyleManager = ({ teams, setTeams, currentUser }) => {
    const [selectedTeamId, setSelectedTeamId] = useState(
        currentUser.roles.includes('admin') ? teams[0]?.id : currentUser.teamId
    );
    const [style, setStyle] = useState({});
    const [saved, setSaved] = useState(false);

    // Filter teams based on user role
    const availableTeams = currentUser.roles.includes('admin') 
        ? teams 
        : teams.filter(t => t.id === currentUser.teamId);

    const selectedTeam = teams.find(t => t.id === selectedTeamId);

    // Initialize style when team changes
    React.useEffect(() => {
        if (selectedTeam) {
            setStyle(selectedTeam.style || {
                bannerUrl: '',
                primaryColor: '#dc2626',
                backgroundColor: '#ffffff',
                textColor: '#000000',
                fontFamily: 'Inter, sans-serif',
                formBackgroundColor: '#f8fafc',
                visibleTabs: {
                    roster: true,
                    schedule: true,
                    media: true,
                    social: true,
                    contact: true
                }
            });
        }
    }, [selectedTeam]);

    const handleSave = (e) => {
        e.preventDefault();
        setTeams(prevTeams => prevTeams.map(team => 
            team.id === selectedTeamId ? { ...team, style } : team
        ));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleImageUpload = (e, field) => {
        if (e.target.files && e.target.files[0]) {
            const fileUrl = URL.createObjectURL(e.target.files[0]);
            setStyle(prev => ({...prev, [field]: fileUrl}));
        }
    };

    if (!selectedTeam) return <div>No team found.</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {currentUser.roles.includes('admin') && (
                    <div>
                        <label className="block font-semibold text-slate-700 mb-2">Select Team</label>
                        <select 
                            value={selectedTeamId} 
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            className="w-full p-3 border border-slate-300 rounded-lg"
                        >
                            {availableTeams.map(team => (
                                <option key={team.id} value={team.id}>{team.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6 bg-slate-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold text-slate-800">Style Controls</h3>
                    
                    <div>
                        <FileUploadInput
                            label="Team Logo"
                            accept="image/*"
                            currentValue={style.logoUrl || ''}
                            onChange={(url) => setStyle(prev => ({...prev, logoUrl: url}))}
                            placeholder="Upload team logo or paste image URL"
                            enableCrop={false}
                        />
                    </div>

                    <div>
                        <FileUploadInput
                            label="Team Banner"
                            accept="image/*"
                            currentValue={style.bannerUrl || ''}
                            onChange={(url) => setStyle(prev => ({...prev, bannerUrl: url}))}
                            placeholder="Upload team banner or paste image URL"
                            enableCrop={false}
                        />
                    </div>

                    {/* === TEAM BACKGROUND IMAGE === */}
                    <div className="border-t border-slate-300 pt-4">
                        <FileUploadInput
                            label="Team Page Background Image"
                            accept="image/*"
                            currentValue={style.pageBackgroundImage || ''}
                            onChange={(url) => setStyle(prev => ({...prev, pageBackgroundImage: url}))}
                            placeholder="Upload team background or paste image URL"
                            enableCrop={false}
                        />
                        
                        {/* Background Display Mode */}
                        <div className="mt-4">
                            <label className="block font-semibold text-slate-700 mb-2">Background Display Mode</label>
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="teamBackgroundMode" 
                                        value="cover" 
                                        checked={(style.pageBackgroundMode || 'cover') === 'cover'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundMode: e.target.value}))} 
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">Cover (Fill)</div>
                                        <div className="text-xs text-slate-500">Covers entire page area</div>
                                    </div>
                                </label>
                                
                                <label className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="teamBackgroundMode" 
                                        value="contain" 
                                        checked={(style.pageBackgroundMode || 'cover') === 'contain'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundMode: e.target.value}))} 
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">Contain (Fit)</div>
                                        <div className="text-xs text-slate-500">Shows entire image within page</div>
                                    </div>
                                </label>
                                
                                <label className="flex items-center space-x-2 border rounded p-3 cursor-pointer hover:bg-slate-50">
                                    <input 
                                        type="radio" 
                                        name="teamBackgroundMode" 
                                        value="repeat" 
                                        checked={(style.pageBackgroundMode || 'cover') === 'repeat'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundMode: e.target.value}))} 
                                        className="text-blue-600"
                                    />
                                    <div>
                                        <div className="font-medium">Repeat (Tile)</div>
                                        <div className="text-xs text-slate-500">Repeats image as pattern</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {/* Background Opacity */}
                        <div className="mt-4">
                            <label className="block font-semibold text-slate-700 mb-2">
                                Background Opacity: {Math.round(((style.pageBackgroundOpacity !== undefined ? style.pageBackgroundOpacity : 0.1)) * 100)}%
                            </label>
                            <input 
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={style.pageBackgroundOpacity !== undefined ? style.pageBackgroundOpacity : 0.1}
                                onChange={(e) => setStyle(prev => ({...prev, pageBackgroundOpacity: parseFloat(e.target.value)}))}
                                className="w-full"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>Transparent (Subtle)</span>
                                <span>Opaque (Bold)</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Lower values make the background more subtle for better text readability</p>
                        </div>
                        
                        <p className="text-xs text-slate-500 mt-2">Background image for this team's page</p>
                    </div>

                    {/* === TEAM MUSIC === */}
                    <div className="border-t border-slate-300 pt-4">
                        <label className="block font-semibold text-slate-700 mb-2">Team Music</label>
                        <input 
                            type="file"
                            accept="audio/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const fileUrl = URL.createObjectURL(e.target.files[0]);
                                    setStyle(prev => ({...prev, musicUrl: fileUrl}));
                                    // Also update the team directly for immediate music functionality
                                    setTeams(prevTeams => prevTeams.map(team => 
                                        team.id === selectedTeamId ? { ...team, musicUrl: fileUrl } : team
                                    ));
                                }
                            }}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        <input 
                            type="url"
                            value={style.musicUrl || selectedTeam.musicUrl || ''}
                            onChange={(e) => {
                                setStyle(prev => ({...prev, musicUrl: e.target.value}));
                                // Also update the team directly for immediate music functionality
                                setTeams(prevTeams => prevTeams.map(team => 
                                    team.id === selectedTeamId ? { ...team, musicUrl: e.target.value } : team
                                ));
                            }}
                            placeholder="Or enter music URL (MP3, Spotify, SoundCloud, etc.)"
                            className="w-full p-2 border border-slate-300 rounded-lg mt-2"
                        />
                        <p className="text-xs text-slate-500 mt-1">Team theme song that plays when viewing this team's page</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Primary Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.primaryColor }}
                                >
                                    <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                        {style.primaryColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.primaryColor}
                                    onChange={(e) => setStyle(prev => ({...prev, primaryColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Background Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.backgroundColor }}
                                >
                                    <span className="text-slate-700 font-semibold text-sm bg-white bg-opacity-75 px-2 py-1 rounded">
                                        {style.backgroundColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.backgroundColor}
                                    onChange={(e) => setStyle(prev => ({...prev, backgroundColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Text Color</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3 bg-white"
                                >
                                    <span 
                                        className="font-semibold text-sm px-2 py-1 rounded"
                                        style={{ color: style.textColor }}
                                    >
                                        {style.textColor} Sample Text
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.textColor}
                                    onChange={(e) => setStyle(prev => ({...prev, textColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Form Background</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.formBackgroundColor }}
                                >
                                    <span className="text-slate-700 font-semibold text-sm bg-white bg-opacity-75 px-2 py-1 rounded">
                                        {style.formBackgroundColor}
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.formBackgroundColor}
                                    onChange={(e) => setStyle(prev => ({...prev, formBackgroundColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Font Family</label>
                            <select 
                                value={style.fontFamily}
                                onChange={(e) => setStyle(prev => ({...prev, fontFamily: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg"
                            >
                                <option value="Inter, sans-serif">Inter (Default)</option>
                                <option value="'Roboto', sans-serif">Roboto</option>
                                <option value="'Open Sans', sans-serif">Open Sans</option>
                                <option value="'Montserrat', sans-serif">Montserrat</option>
                                <option value="'Poppins', sans-serif">Poppins</option>
                                <option value="'Playfair Display', serif">Playfair Display</option>
                                <option value="'Oswald', sans-serif">Oswald (Sports)</option>
                            </select>
                        </div>
                    </div>

                    {/* Tab Visibility Controls */}
                    <div className="mt-6">
                        <h4 className="text-lg font-bold text-slate-800 mb-4">Visible Tabs</h4>
                        <p className="text-sm text-slate-600 mb-4">Control which tabs are visible on your team page to visitors</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'home', label: 'Home', default: true },
                                { key: 'roster', label: 'Roster', default: true },
                                { key: 'stats', label: 'Stats', default: true },
                                { key: 'schedule', label: 'Schedule', default: true },
                                { key: 'media', label: 'Photos & Videos', default: true },
                                { key: 'social', label: 'Social', default: true },
                                { key: 'contact', label: 'Contact', default: true }
                            ].map(tab => (
                                <label key={tab.key} className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        checked={style.visibleTabs?.[tab.key] !== false}
                                        onChange={(e) => setStyle(prev => ({
                                            ...prev, 
                                            visibleTabs: {
                                                ...prev.visibleTabs,
                                                [tab.key]: e.target.checked
                                            }
                                        }))}
                                        className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">{tab.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end items-center space-x-4">
                        {saved && <span className="text-green-600 font-semibold">✓ Saved!</span>}
                        <button 
                            type="submit" 
                            className="bg-red-800 text-white px-6 py-3 rounded-lg hover:bg-red-900 font-semibold"
                        >
                            Save Team Style
                        </button>
                    </div>
                </form>
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-bold text-slate-800">Live Preview</h3>
                <div className="border rounded-lg overflow-hidden shadow-lg">
                    <div 
                        className="h-32 bg-cover bg-center flex items-end p-4 relative"
                        style={{ 
                            backgroundImage: (style.bannerContentType === 'image' && style.bannerImage) 
                                ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${style.bannerImage})` 
                                : `linear-gradient(45deg, ${style.bannerColor || style.primaryColor}, ${(style.bannerColor || style.primaryColor)}dd)`,
                            fontFamily: style.bannerFontFamily || 'Inter, sans-serif'
                        }}
                    >
                        <div className="flex items-center">
                            <img 
                                src={selectedTeam?.logo || 'https://placehold.co/50x50/ffffff/000000?text=LOGO'} 
                                alt="Team Logo" 
                                className="w-8 h-8 rounded-full mr-3 bg-white p-1 object-contain" 
                            />
                            <h3 
                                className="font-bold tracking-wide"
                                style={{
                                    fontSize: `${Math.max(16, (style.bannerFontSize || 24) * 0.8)}px`,
                                    color: style.bannerTextColor || '#ffffff',
                                    fontWeight: style.bannerTextBold ? 'bold' : 'normal',
                                    textShadow: style.bannerTextShadow ? '2px 2px 4px rgba(0,0,0,0.7)' : '0 1px 2px rgba(0,0,0,0.5)'
                                }}
                            >
                                {style.bannerText || selectedTeam?.name || 'Team Name'}
                            </h3>
                        </div>
                    </div>
                    <div className="p-4" style={{ backgroundColor: style.backgroundColor, fontFamily: style.fontFamily }}>
                        <div className="flex mb-4 border-b">
                            <button 
                                className="px-4 py-2 font-semibold border-b-2 transition-colors"
                                style={{ 
                                    borderColor: style.primaryColor, 
                                    color: style.primaryColor,
                                    fontFamily: style.fontFamily 
                                }}
                            >
                                Active Tab
                            </button>
                            <button 
                                className="px-4 py-2 font-semibold text-slate-500 border-b-2 border-transparent"
                                style={{ fontFamily: style.fontFamily }}
                            >
                                Inactive Tab
                            </button>
                        </div>
                        <h4 className="text-xl font-bold mb-2" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                            Roster & Stats
                        </h4>
                        <p className="mb-4" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                            This is how your team page will look with the selected colors and fonts.
                        </p>
                        
                        {/* Form Preview */}
                        <div 
                            className="p-4 rounded-lg border mb-4"
                            style={{ backgroundColor: style.formBackgroundColor }}
                        >
                            <h5 className="font-semibold mb-3" style={{ color: style.textColor, fontFamily: style.fontFamily }}>
                                Sample Form
                            </h5>
                            <div className="space-y-2">
                                <input 
                                    type="text" 
                                    placeholder="Player Name" 
                                    className="w-full p-2 border rounded"
                                    style={{ fontFamily: style.fontFamily }}
                                />
                                <input 
                                    type="email" 
                                    placeholder="Email Address" 
                                    className="w-full p-2 border rounded"
                                    style={{ fontFamily: style.fontFamily }}
                                />
                            </div>
                        </div>
                        
                        <button 
                            className="px-4 py-2 text-white rounded-lg text-sm font-semibold"
                            style={{ backgroundColor: style.primaryColor, fontFamily: style.fontFamily }}
                        >
                            Example Button
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WebsiteStyleManager = ({ websiteStyle, setWebsiteStyle }) => {
    const [style, setStyle] = useState(websiteStyle);
    const [saved, setSaved] = useState(false);

    // Sync local state when websiteStyle prop changes
    useEffect(() => {
        setStyle(websiteStyle);
    }, [websiteStyle]);

    const handleSave = () => {
        setWebsiteStyle(style);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="border-b border-slate-200 pb-4 mb-6">
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Website Appearance</h3>
                <p className="text-slate-600">Customize how your league website looks across all pages and devices</p>
            </div>

            <div className="space-y-8">
                {/* === TOP HEADER BAR === */}
                <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                        <Layout className="mr-2" size={20} />
                        Top Header Bar
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            {/* Banner Content Type Toggle */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Banner Content</label>
                                <div className="flex space-x-4 mb-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="bannerContentType"
                                            value="text"
                                            checked={!style.bannerImage || style.bannerContentType === 'text'}
                                            onChange={(e) => setStyle(prev => ({...prev, bannerContentType: 'text'}))}
                                            className="mr-2"
                                        />
                                        Text Banner
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="bannerContentType"
                                            value="image"
                                            checked={style.bannerContentType === 'image'}
                                            onChange={(e) => setStyle(prev => ({...prev, bannerContentType: 'image'}))}
                                            className="mr-2"
                                        />
                                        Image Banner
                                    </label>
                                </div>
                            </div>

                            {/* Text Banner Options */}
                            {(!style.bannerImage || style.bannerContentType === 'text') && (
                                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-2">Banner Text</label>
                                        <input 
                                            type="text"
                                            value={style.bannerText || 'MLBL'}
                                            onChange={(e) => setStyle(prev => ({...prev, bannerText: e.target.value}))}
                                            className="w-full p-3 border border-slate-300 rounded-lg"
                                            placeholder="Your league name or title"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-2">Font Family</label>
                                            <select 
                                                value={style.bannerFontFamily || 'Inter, sans-serif'}
                                                onChange={(e) => setStyle(prev => ({...prev, bannerFontFamily: e.target.value}))}
                                                className="w-full p-2 border border-slate-300 rounded-lg"
                                            >
                                                <option value="Inter, sans-serif">Inter (Modern)</option>
                                                <option value="Arial, sans-serif">Arial (Clean)</option>
                                                <option value="Georgia, serif">Georgia (Classic)</option>
                                                <option value="'Times New Roman', serif">Times New Roman</option>
                                                <option value="'Courier New', monospace">Courier New</option>
                                                <option value="Helvetica, sans-serif">Helvetica</option>
                                                <option value="Verdana, sans-serif">Verdana</option>
                                                <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                                                <option value="Impact, sans-serif">Impact (Bold)</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-2">
                                                Font Size: {style.bannerFontSize || 24}px
                                            </label>
                                            <input 
                                                type="range"
                                                min="16"
                                                max="60"
                                                step="2"
                                                value={style.bannerFontSize || 24}
                                                onChange={(e) => setStyle(prev => ({...prev, bannerFontSize: parseInt(e.target.value)}))}
                                                className="w-full"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-2">Text Color</label>
                                        <div className="relative">
                                            <div 
                                                className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                                style={{ backgroundColor: style.bannerTextColor || '#ffffff' }}
                                            >
                                                <span 
                                                    className="font-semibold text-sm px-2 py-1 rounded"
                                                    style={{ 
                                                        color: style.bannerTextColor || '#ffffff',
                                                        backgroundColor: style.bannerTextColor === '#ffffff' ? '#000000' : '#ffffff'
                                                    }}
                                                >
                                                    {style.bannerTextColor || '#ffffff'}
                                                </span>
                                            </div>
                                            <input 
                                                type="color" 
                                                value={style.bannerTextColor || '#ffffff'}
                                                onChange={(e) => setStyle(prev => ({...prev, bannerTextColor: e.target.value}))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-2">Text Effects</label>
                                        <div className="space-y-2">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={style.bannerTextBold || false}
                                                    onChange={(e) => setStyle(prev => ({...prev, bannerTextBold: e.target.checked}))}
                                                    className="mr-2"
                                                />
                                                Bold Text
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={style.bannerTextShadow || false}
                                                    onChange={(e) => setStyle(prev => ({...prev, bannerTextShadow: e.target.checked}))}
                                                    className="mr-2"
                                                />
                                                Text Shadow
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Image Banner Options */}
                            {style.bannerContentType === 'image' && (
                                <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-2">Banner Image</label>
                                        <FileUploadInput
                                            accept="image/*"
                                            currentValue={style.bannerImage || ''}
                                            onChange={(url) => setStyle(prev => ({...prev, bannerImage: url}))}
                                            placeholder="Upload banner image"
                                            enableCrop={false}
                                            cropAspectRatio="16:9"
                                        />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Background Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.bannerColor || style.primaryColor }}
                                    >
                                        <span className="text-white font-semibold text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                                            {style.bannerColor || style.primaryColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.bannerColor || style.primaryColor || '#1e293b'}
                                        onChange={(e) => setStyle(prev => ({...prev, bannerColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Header Logo (Optional)</label>
                                <FileUploadInput
                                    accept="image/*"
                                    currentValue={style.bannerLogo || ''}
                                    onChange={(url) => setStyle(prev => ({...prev, bannerLogo: url}))}
                                    placeholder="Upload header logo or enter URL"
                                    enableCrop={false}
                                    cropAspectRatio="1:1"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-2">Logo Position</label>
                                    <select 
                                        value={style.bannerLogoPosition || 'left'}
                                        onChange={(e) => setStyle(prev => ({...prev, bannerLogoPosition: e.target.value}))}
                                        className="w-full p-3 border border-slate-300 rounded-lg"
                                    >
                                        <option value="left">Left</option>
                                        <option value="center">Center</option>
                                        <option value="right">Right</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-semibold text-slate-700 mb-2">Logo Size</label>
                                    <select 
                                        value={style.bannerLogoSize || 'medium'}
                                        onChange={(e) => setStyle(prev => ({...prev, bannerLogoSize: e.target.value}))}
                                        className="w-full p-3 border border-slate-300 rounded-lg"
                                    >
                                        <option value="small">Small</option>
                                        <option value="medium">Medium</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>
                            </div>

                            {style.bannerImage && (
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-2">
                                        Background Opacity: {Math.round((style.bannerOpacity || 0.3) * 100)}%
                                    </label>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={style.bannerOpacity || 0.3}
                                        onChange={(e) => setStyle(prev => ({...prev, bannerOpacity: parseFloat(e.target.value)}))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === NEWS TICKER === */}
                <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                        <Zap className="mr-2" size={20} />
                        News Ticker
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Ticker Label Text</label>
                            <input 
                                type="text"
                                value={style.newsLabel || 'NEWS'}
                                onChange={(e) => setStyle(prev => ({...prev, newsLabel: e.target.value}))}
                                className="w-full p-3 border border-slate-300 rounded-lg"
                                placeholder="Label for news ticker (NEWS, UPDATES, etc.)"
                            />
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Ticker Colors</label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <div 
                                        className="w-full h-10 border rounded cursor-pointer flex items-center px-2"
                                        style={{ backgroundColor: style.tickerColor }}
                                    >
                                        <span className="text-white text-xs bg-black bg-opacity-50 px-1 rounded">Background</span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.tickerColor || '#1e293b'}
                                        onChange={(e) => setStyle(prev => ({...prev, tickerColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                
                                <div className="relative">
                                    <div 
                                        className="w-full h-10 border rounded cursor-pointer flex items-center px-2"
                                        style={{ backgroundColor: style.tickerTextColor }}
                                    >
                                        <span className="text-white text-xs bg-black bg-opacity-50 px-1 rounded">Text</span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.tickerTextColor || '#94a3b8'}
                                        onChange={(e) => setStyle(prev => ({...prev, tickerTextColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-3">Content Filters</label>
                            <p className="text-sm text-slate-600 mb-3">Choose what types of events appear in the ticker</p>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { key: 'games', label: 'Games', icon: '🏆', desc: 'Regular season games' },
                                    { key: 'tournaments', label: 'Tournaments', icon: '🏅', desc: 'Tournament events' },
                                    { key: 'practices', label: 'Practices', icon: '⚽', desc: 'Team practices' },
                                    { key: 'meetings', label: 'Meetings', icon: '📅', desc: 'Team meetings' },
                                    { key: 'social', label: 'Social Events', icon: '🎉', desc: 'Social gatherings' },
                                    { key: 'other', label: 'Other Events', icon: '📝', desc: 'Other activities' }
                                ].map(filter => (
                                    <label key={filter.key} className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={style.tickerFilters?.[filter.key] !== false}
                                            onChange={(e) => setStyle(prev => ({
                                                ...prev,
                                                tickerFilters: {
                                                    ...prev.tickerFilters,
                                                    [filter.key]: e.target.checked
                                                }
                                            }))}
                                            className="mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{filter.icon}</span>
                                                <span className="font-medium text-slate-700">{filter.label}</span>
                                            </div>
                                            <div className="text-xs text-slate-500">{filter.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-3">Date Ranges</label>
                            <p className="text-sm text-slate-600 mb-3">Control how far back and forward the ticker looks for events</p>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Look Back: {style.tickerLookBack || 7} days
                                    </label>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="30"
                                        step="1"
                                        value={style.tickerLookBack || 7}
                                        onChange={(e) => setStyle(prev => ({...prev, tickerLookBack: parseInt(e.target.value)}))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>Today only</span>
                                        <span>30 days ago</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">
                                        Look Forward: {style.tickerLookForward || 14} days
                                    </label>
                                    <input 
                                        type="range"
                                        min="1"
                                        max="90"
                                        step="1"
                                        value={style.tickerLookForward || 14}
                                        onChange={(e) => setStyle(prev => ({...prev, tickerLookForward: parseInt(e.target.value)}))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                                        <span>Tomorrow only</span>
                                        <span>3 months ahead</span>
                                    </div>
                                </div>
                                
                                <div className="text-xs text-slate-500 bg-slate-100 p-2 rounded">
                                    📅 Current range: {style.tickerLookBack || 7} days ago to {style.tickerLookForward || 14} days from now
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === NAVIGATION SIDEBAR === */}
                <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                        <Menu className="mr-2" size={20} />
                        Navigation Sidebar
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Sidebar Logo</label>
                            <FileUploadInput
                                accept="image/*"
                                currentValue={style.sidebarLogo || ''}
                                onChange={(url) => setStyle(prev => ({...prev, sidebarLogo: url}))}
                                placeholder="Upload sidebar logo"
                                enableCrop={false}
                                cropAspectRatio="1:1"
                            />
                            <p className="text-xs text-slate-500 mt-1">Logo displayed in top corner of sidebar navigation</p>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Sidebar Background Image</label>
                            <FileUploadInput
                                accept="image/*"
                                currentValue={style.sidebarImage || ''}
                                onChange={(url) => setStyle(prev => ({...prev, sidebarImage: url}))}
                                placeholder="Upload sidebar background or enter URL"
                                enableCrop={false}
                                cropAspectRatio="free"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Display Mode</label>
                                <select 
                                    value={style.sidebarMode || 'cover'}
                                    onChange={(e) => setStyle(prev => ({...prev, sidebarMode: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="cover">Cover (Fill)</option>
                                    <option value="contain">Contain (Fit)</option>
                                    <option value="repeat">Repeat (Tile)</option>
                                </select>
                            </div>

                            {style.sidebarImage && (
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-2">
                                        Image Opacity: {Math.round((style.sidebarOpacity || 0.2) * 100)}%
                                    </label>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={style.sidebarOpacity || 0.2}
                                        onChange={(e) => setStyle(prev => ({...prev, sidebarOpacity: parseFloat(e.target.value)}))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === PAGE BACKGROUND === */}
                <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                        <ImageIcon className="mr-2" size={20} />
                        Page Background
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Background Color</label>
                                <div className="relative">
                                    <div 
                                        className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                        style={{ backgroundColor: style.pageBackgroundColor }}
                                    >
                                        <span className="text-slate-800 font-semibold text-sm bg-white bg-opacity-80 px-2 py-1 rounded">
                                            {style.pageBackgroundColor}
                                        </span>
                                    </div>
                                    <input 
                                        type="color" 
                                        value={style.pageBackgroundColor || '#f1f5f9'}
                                        onChange={(e) => setStyle(prev => ({...prev, pageBackgroundColor: e.target.value}))}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Background Image (Optional)</label>
                                <FileUploadInput
                                    accept="image/*"
                                    currentValue={style.backgroundImage || ''}
                                    onChange={(url) => setStyle(prev => ({...prev, backgroundImage: url}))}
                                    placeholder="Upload page background or enter URL"
                                    enableCrop={false}
                                    cropAspectRatio="free"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Display Mode</label>
                                <select 
                                    value={style.backgroundMode || 'cover'}
                                    onChange={(e) => setStyle(prev => ({...prev, backgroundMode: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="cover">Cover (Fill)</option>
                                    <option value="contain">Contain (Fit)</option>
                                    <option value="repeat">Repeat (Tile)</option>
                                </select>
                            </div>

                            {style.backgroundImage && (
                                <div>
                                    <label className="block font-semibold text-slate-700 mb-2">
                                        Image Opacity: {Math.round((style.backgroundOpacity || 0.1) * 100)}%
                                    </label>
                                    <input 
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={style.backgroundOpacity || 0.1}
                                        onChange={(e) => setStyle(prev => ({...prev, backgroundOpacity: parseFloat(e.target.value)}))}
                                        className="w-full"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* === TEXT STYLING === */}
                <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                        <Type className="mr-2" size={20} />
                        Text & Colors
                    </h4>
                    
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Body Text</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.textColor }}
                                >
                                    <span className="text-white font-semibold text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                        Sample
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.textColor || '#1e293b'}
                                    onChange={(e) => setStyle(prev => ({...prev, textColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Headings</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.headingColor }}
                                >
                                    <span className="text-white font-semibold text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                        Heading
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.headingColor || '#0f172a'}
                                    onChange={(e) => setStyle(prev => ({...prev, headingColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Links</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.linkColor }}
                                >
                                    <span className="text-white font-semibold text-xs bg-black bg-opacity-50 px-2 py-1 rounded">
                                        Link
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.linkColor || '#2563eb'}
                                    onChange={(e) => setStyle(prev => ({...prev, linkColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Form Background</label>
                            <div className="relative">
                                <div 
                                    className="w-full h-12 border rounded-lg cursor-pointer flex items-center px-3"
                                    style={{ backgroundColor: style.formBackgroundColor || '#f8fafc' }}
                                >
                                    <span className="text-slate-700 font-semibold text-xs bg-white bg-opacity-75 px-2 py-1 rounded">
                                        Form
                                    </span>
                                </div>
                                <input 
                                    type="color" 
                                    value={style.formBackgroundColor || '#f8fafc'}
                                    onChange={(e) => setStyle(prev => ({...prev, formBackgroundColor: e.target.value}))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-1">Background color for all forms and modals</p>
                        </div>
                    </div>
                    
                    {/* Form Preview */}
                    <div className="mt-4">
                        <div 
                            className="p-4 rounded-lg border-2 border-dashed border-slate-300"
                            style={{ backgroundColor: style.formBackgroundColor || '#f8fafc' }}
                        >
                            <h5 className="font-semibold mb-3" style={{ color: style.textColor }}>
                                Sample Form Preview
                            </h5>
                            <div className="space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Team name..." 
                                    className="w-full p-2 border rounded" 
                                    disabled
                                />
                                <input 
                                    type="email" 
                                    placeholder="Contact email..." 
                                    className="w-full p-2 border rounded" 
                                    disabled
                                />
                                <button 
                                    className="px-4 py-2 rounded text-white" 
                                    style={{ backgroundColor: style.primaryColor }}
                                    disabled
                                >
                                    Save Team
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === LOGO WATERMARK === */}
                <div className="bg-slate-50 p-6 rounded-lg">
                    <h4 className="text-xl font-semibold text-slate-800 mb-4 flex items-center border-b border-slate-200 pb-3">
                        <Star className="mr-2" size={20} />
                        Page Watermark Logo
                    </h4>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block font-semibold text-slate-700 mb-2">Watermark Logo</label>
                            <FileUploadInput
                                accept="image/*"
                                currentValue={style.overlayLogo || ''}
                                onChange={(url) => setStyle(prev => ({...prev, overlayLogo: url}))}
                                placeholder="Upload watermark logo or enter URL"
                                enableCrop={false}
                                cropAspectRatio="1:1"
                            />
                            <p className="text-xs text-slate-500 mt-1">Appears subtly on all pages</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Position</label>
                                <select 
                                    value={style.overlayLogoAlignment || 'center'}
                                    onChange={(e) => setStyle(prev => ({...prev, overlayLogoAlignment: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="left">Bottom Left</option>
                                    <option value="center">Bottom Center</option>
                                    <option value="right">Bottom Right</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-semibold text-slate-700 mb-2">Size</label>
                                <select 
                                    value={style.overlayLogoSize || 'medium'}
                                    onChange={(e) => setStyle(prev => ({...prev, overlayLogoSize: e.target.value}))}
                                    className="w-full p-3 border border-slate-300 rounded-lg"
                                >
                                    <option value="small">Small</option>
                                    <option value="medium">Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-8 border-t border-slate-200 mt-8">
                {saved && <span className="text-green-600 font-semibold mr-4 flex items-center"><span className="mr-1">✓</span> Changes Saved!</span>}
                <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    Save All Changes
                </button>
            </div>
        </div>
    );
};

// ===== SEASONS MANAGEMENT SYSTEM =====
const SeasonManager = ({ seasons, setSeasons, currentSeason, setCurrentSeason, teams, setTeams, players, setPlayers, leagueSchedule, setLeagueSchedule }) => {
    const [editingSeason, setEditingSeason] = useState(null);
    const [showPortRoster, setShowPortRoster] = useState(null);
    const [saved, setSaved] = useState(false);

    // Generate unique season ID
    const generateSeasonId = (name) => {
        return `season-${name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    };

    // Create new season
    const handleCreateSeason = () => {
        setEditingSeason({
            id: '',
            name: '',
            startDate: '',
            endDate: '',
            status: 'planned',
            teams: [],
            schedule: [],
            standings: [],
            playoffs: { bracket: null, games: [] }
        });
    };

    // Save season (create or update)
    const handleSaveSeason = (e) => {
        e.preventDefault();
        
        if (!editingSeason.name.trim()) {
            alert('Please enter a season name');
            return;
        }

        const seasonData = {
            ...editingSeason,
            id: editingSeason.id || generateSeasonId(editingSeason.name),
        };

        if (editingSeason.id) {
            // Update existing season
            setSeasons(seasons.map(s => s.id === editingSeason.id ? seasonData : s));
        } else {
            // Create new season
            setSeasons([...seasons, seasonData]);
            
            // If this is the first season, make it current
            if (seasons.length === 0) {
                setCurrentSeason(seasonData.id);
            }
        }

        setEditingSeason(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Set active season
    const handleSetActiveSeason = (seasonId) => {
        setCurrentSeason(seasonId);
        const season = seasons.find(s => s.id === seasonId);
        
        if (season) {
            // Load season data into main state
            setTeams(season.teams || []);
            setLeagueSchedule(season.schedule || []);
            
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    // Port roster from previous season
    const handlePortRoster = (fromSeasonId, toSeasonId, teamId) => {
        const fromSeason = seasons.find(s => s.id === fromSeasonId);
        const toSeason = seasons.find(s => s.id === toSeasonId);
        
        if (fromSeason && toSeason) {
            const fromTeam = fromSeason.teams?.find(t => t.id === teamId);
            if (fromTeam && fromTeam.seasonRoster) {
                // Copy roster with reset active status
                const portedRoster = fromTeam.seasonRoster.map(player => ({
                    ...player,
                    active: true // Reset all to active for new season
                }));

                // Update the target season's team
                const updatedSeasons = seasons.map(season => {
                    if (season.id === toSeasonId) {
                        return {
                            ...season,
                            teams: season.teams?.map(team => {
                                if (team.id === teamId) {
                                    return { ...team, seasonRoster: portedRoster };
                                }
                                return team;
                            }) || []
                        };
                    }
                    return season;
                });

                setSeasons(updatedSeasons);
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
            }
        }
        setShowPortRoster(null);
    };

    // Delete season with confirmation
    const handleDeleteSeason = (seasonId) => {
        const season = seasons.find(s => s.id === seasonId);
        if (season && window.confirm(`Are you sure you want to delete "${season.name}"? This action cannot be undone.`)) {
            setSeasons(seasons.filter(s => s.id !== seasonId));
            
            // If deleting current season, clear it
            if (currentSeason === seasonId) {
                setCurrentSeason(null);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Season Management</h2>
                    <p className="text-slate-600">Create and manage seasons with custom rosters and schedules</p>
                </div>
                <button 
                    onClick={handleCreateSeason}
                    className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Create New Season
                </button>
            </div>

            {saved && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    ✓ Season changes saved successfully!
                </div>
            )}

            {/* Current Season Display */}
            {currentSeason && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-800 mb-2">Current Active Season</h3>
                    <div className="flex items-center justify-between">
                        <span className="text-blue-700">
                            {seasons.find(s => s.id === currentSeason)?.name || 'Unknown Season'}
                        </span>
                        <span className="text-sm text-blue-600">
                            {seasons.find(s => s.id === currentSeason)?.status || 'active'}
                        </span>
                    </div>
                </div>
            )}

            {/* Seasons List */}
            <div className="grid gap-4">
                {seasons.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <Trophy className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">No Seasons Yet</h3>
                        <p className="text-slate-500 mb-4">Create your first season to organize teams, schedules, and stats</p>
                        <button 
                            onClick={handleCreateSeason}
                            className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900"
                        >
                            Create First Season
                        </button>
                    </div>
                ) : (
                    seasons.map(season => (
                        <div key={season.id} className="bg-white border rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-semibold text-slate-800">{season.name}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                        season.status === 'active' ? 'bg-green-100 text-green-800' :
                                        season.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {season.status}
                                    </span>
                                    {currentSeason === season.id && (
                                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-semibold">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {currentSeason !== season.id && (
                                        <button 
                                            onClick={() => handleSetActiveSeason(season.id)}
                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                        >
                                            Set Active
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setEditingSeason(season)}
                                        className="text-slate-500 hover:text-slate-700 p-1"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteSeason(season.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                                <div>
                                    <span className="text-slate-500">Division:</span>
                                    <div className="font-medium">{season.division || 'Field'}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500">Start Date:</span>
                                    <div className="font-medium">{season.startDate || 'Not set'}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500">End Date:</span>
                                    <div className="font-medium">{season.endDate || 'Not set'}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500">Teams:</span>
                                    <div className="font-medium">{season.teams?.length || 0}</div>
                                </div>
                                <div>
                                    <span className="text-slate-500">Games:</span>
                                    <div className="font-medium">{season.schedule?.length || 0}</div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Season Modal */}
            {editingSeason && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingSeason.id ? 'Edit Season' : 'Create New Season'}
                        </h3>
                        <form onSubmit={handleSaveSeason} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Season Name</label>
                                <input 
                                    type="text" 
                                    value={editingSeason.name} 
                                    onChange={e => setEditingSeason({...editingSeason, name: e.target.value})} 
                                    placeholder="e.g., Spring Championship 2024" 
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
                                <select 
                                    value={editingSeason.division || 'Field'} 
                                    onChange={e => setEditingSeason({...editingSeason, division: e.target.value})} 
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Field">Field Lacrosse</option>
                                    <option value="Box">Box Lacrosse</option>
                                    <option value="Both">Both Divisions</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={editingSeason.startDate} 
                                        onChange={e => setEditingSeason({...editingSeason, startDate: e.target.value})} 
                                        className="w-full p-2 border rounded" 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={editingSeason.endDate} 
                                        onChange={e => setEditingSeason({...editingSeason, endDate: e.target.value})} 
                                        className="w-full p-2 border rounded" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select 
                                    value={editingSeason.status} 
                                    onChange={e => setEditingSeason({...editingSeason, status: e.target.value})} 
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="planned">Planned</option>
                                    <option value="active">Active</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setEditingSeason(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                    {editingSeason.id ? 'Update Season' : 'Create Season'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== FRIENDS MANAGEMENT SYSTEM =====
const FriendsManager = ({ friends, setFriends }) => {
    const [editingFriend, setEditingFriend] = useState(null);
    const [saved, setSaved] = useState(false);

    const handleCreateFriend = () => {
        setEditingFriend({
            id: '',
            name: '',
            photo: '',
            description: '',
            website: '',
            socialMedia: {
                twitter: '',
                facebook: '',
                instagram: '',
                youtube: ''
            }
        });
    };

    const handleSaveFriend = (e) => {
        e.preventDefault();
        
        if (!editingFriend.name.trim()) {
            alert('Please enter a friend name');
            return;
        }

        const friendData = {
            ...editingFriend,
            id: editingFriend.id || `friend-${Date.now()}`
        };

        if (editingFriend.id) {
            setFriends(friends.map(f => f.id === editingFriend.id ? friendData : f));
        } else {
            setFriends([...friends, friendData]);
        }

        setEditingFriend(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDeleteFriend = (friendId) => {
        const friend = friends.find(f => f.id === friendId);
        if (friend && window.confirm(`Are you sure you want to delete "${friend.name}"?`)) {
            setFriends(friends.filter(f => f.id !== friendId));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Friends & Partners</h2>
                    <p className="text-slate-600">Manage league friends, partners, and community connections</p>
                </div>
                <button 
                    onClick={handleCreateFriend}
                    className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Friend
                </button>
            </div>

            {saved && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    ✓ Changes saved successfully!
                </div>
            )}

            {/* Friends Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {friends.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                        <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">No Friends Yet</h3>
                        <p className="text-slate-500 mb-4">Add friends and partners to showcase your community connections</p>
                        <button 
                            onClick={handleCreateFriend}
                            className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900"
                        >
                            Add First Friend
                        </button>
                    </div>
                ) : (
                    friends.map(friend => (
                        <div key={friend.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                            <div className="text-center">
                                <img 
                                    src={friend.photo || 'https://placehold.co/100x100/e2e8f0/94a3b8?text=FRIEND'} 
                                    alt={friend.name} 
                                    className="w-20 h-20 mx-auto rounded-full object-contain bg-slate-50 p-1"
                                />
                                <h3 className="font-semibold text-slate-800 mt-3">{friend.name}</h3>
                                {friend.description && (
                                    <p className="text-sm text-slate-600 mt-1">{friend.description}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-center gap-2 mt-4">
                                <button 
                                    onClick={() => setEditingFriend(friend)}
                                    className="text-slate-500 hover:text-slate-700 p-1"
                                    title="Edit friend"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => handleDeleteFriend(friend.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                    title="Delete friend"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Friend Modal */}
            {editingFriend && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingFriend.id ? 'Edit Friend' : 'Add New Friend'}
                        </h3>
                        <form onSubmit={handleSaveFriend} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input 
                                    type="text" 
                                    value={editingFriend.name} 
                                    onChange={e => setEditingFriend({...editingFriend, name: e.target.value})} 
                                    placeholder="Friend or partner name" 
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                <FileUploadInput
                                    accept="image/*"
                                    currentValue={editingFriend.photo || ''}
                                    onChange={(url) => setEditingFriend({...editingFriend, photo: url})}
                                    placeholder="Upload friend photo"
                                    enableCrop={false}
                                    cropAspectRatio="1:1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    value={editingFriend.description} 
                                    onChange={e => setEditingFriend({...editingFriend, description: e.target.value})} 
                                    placeholder="Brief description or role" 
                                    className="w-full p-2 border rounded h-20" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input 
                                    type="url" 
                                    value={editingFriend.website} 
                                    onChange={e => setEditingFriend({...editingFriend, website: e.target.value})} 
                                    placeholder="https://..." 
                                    className="w-full p-2 border rounded" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'twitter', label: 'Twitter', placeholder: '@username' },
                                        { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/page' },
                                        { key: 'instagram', label: 'Instagram', placeholder: '@username' },
                                        { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/channel' }
                                    ].map(social => (
                                        <input 
                                            key={social.key}
                                            type="text" 
                                            value={editingFriend.socialMedia?.[social.key] || ''} 
                                            onChange={e => setEditingFriend({
                                                ...editingFriend, 
                                                socialMedia: {
                                                    ...editingFriend.socialMedia,
                                                    [social.key]: e.target.value
                                                }
                                            })} 
                                            placeholder={`${social.label}: ${social.placeholder}`} 
                                            className="w-full p-2 border rounded text-sm" 
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setEditingFriend(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                    {editingFriend.id ? 'Update Friend' : 'Add Friend'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ===== SPONSORS MANAGEMENT SYSTEM =====
const SponsorsManager = ({ sponsors, setSponsors }) => {
    const [editingSponsor, setEditingSponsor] = useState(null);
    const [saved, setSaved] = useState(false);

    const handleCreateSponsor = () => {
        setEditingSponsor({
            id: '',
            name: '',
            logo: '',
            tier: 'Bronze',
            website: '',
            description: '',
            socialMedia: {
                twitter: '',
                facebook: '',
                instagram: '',
                youtube: ''
            }
        });
    };

    const handleSaveSponsor = (e) => {
        e.preventDefault();
        
        if (!editingSponsor.name.trim()) {
            alert('Please enter a sponsor name');
            return;
        }

        const sponsorData = {
            ...editingSponsor,
            id: editingSponsor.id || `sponsor-${Date.now()}`
        };

        if (editingSponsor.id) {
            setSponsors(sponsors.map(s => s.id === editingSponsor.id ? sponsorData : s));
        } else {
            setSponsors([...sponsors, sponsorData]);
        }

        setEditingSponsor(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleDeleteSponsor = (sponsorId) => {
        const sponsor = sponsors.find(s => s.id === sponsorId);
        if (sponsor && window.confirm(`Are you sure you want to delete "${sponsor.name}"?`)) {
            setSponsors(sponsors.filter(s => s.id !== sponsorId));
        }
    };

    const sponsorsByTier = {
        'Platinum': sponsors.filter(s => s.tier === 'Platinum'),
        'Gold': sponsors.filter(s => s.tier === 'Gold'),
        'Silver': sponsors.filter(s => s.tier === 'Silver'),
        'Bronze': sponsors.filter(s => s.tier === 'Bronze')
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Sponsors & Supporters</h2>
                    <p className="text-slate-600">Manage league sponsors organized by tier level</p>
                </div>
                <button 
                    onClick={handleCreateSponsor}
                    className="bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-900 flex items-center gap-2"
                >
                    <Plus size={20} />
                    Add Sponsor
                </button>
            </div>

            {saved && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    ✓ Changes saved successfully!
                </div>
            )}

            {sponsors.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-300">
                    <Briefcase className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No Sponsors Yet</h3>
                    <p className="text-slate-500 mb-4">Add sponsors and supporters to showcase your partnerships</p>
                    <button 
                        onClick={handleCreateSponsor}
                        className="bg-red-800 text-white px-6 py-2 rounded-lg hover:bg-red-900"
                    >
                        Add First Sponsor
                    </button>
                </div>
            ) : (
                Object.entries(sponsorsByTier).map(([tier, tierSponsors]) => (
                    tierSponsors.length > 0 && (
                        <div key={tier} className="space-y-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-semibold text-slate-800">{tier} Sponsors</h3>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                    tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                    tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                    tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                    'bg-orange-100 text-orange-800'
                                }`}>
                                    {tierSponsors.length} {tierSponsors.length === 1 ? 'Sponsor' : 'Sponsors'}
                                </span>
                            </div>
                            
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {tierSponsors.map(sponsor => (
                                    <div key={sponsor.id} className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="text-center">
                                            <img 
                                                src={sponsor.logo || 'https://placehold.co/120x80/f1f5f9/64748b?text=SPONSOR'} 
                                                alt={sponsor.name} 
                                                className="w-24 h-16 mx-auto rounded object-contain bg-slate-50 p-1"
                                            />
                                            <h4 className="font-semibold text-slate-800 mt-3">{sponsor.name}</h4>
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                                                sponsor.tier === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                                                sponsor.tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                                                sponsor.tier === 'Silver' ? 'bg-gray-100 text-gray-800' :
                                                'bg-orange-100 text-orange-800'
                                            }`}>
                                                {sponsor.tier}
                                            </span>
                                            {sponsor.description && (
                                                <p className="text-sm text-slate-600 mt-2">{sponsor.description}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-center gap-2 mt-4">
                                            <button 
                                                onClick={() => setEditingSponsor(sponsor)}
                                                className="text-slate-500 hover:text-slate-700 p-1"
                                                title="Edit sponsor"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSponsor(sponsor.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete sponsor"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                ))
            )}

            {/* Edit Sponsor Modal */}
            {editingSponsor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-4">
                            {editingSponsor.id ? 'Edit Sponsor' : 'Add New Sponsor'}
                        </h3>
                        <form onSubmit={handleSaveSponsor} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                                <input 
                                    type="text" 
                                    value={editingSponsor.name} 
                                    onChange={e => setEditingSponsor({...editingSponsor, name: e.target.value})} 
                                    placeholder="Company or sponsor name" 
                                    className="w-full p-2 border rounded" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Sponsorship Tier</label>
                                <select 
                                    value={editingSponsor.tier} 
                                    onChange={e => setEditingSponsor({...editingSponsor, tier: e.target.value})} 
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="Platinum">Platinum</option>
                                    <option value="Gold">Gold</option>
                                    <option value="Silver">Silver</option>
                                    <option value="Bronze">Bronze</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                                <FileUploadInput
                                    accept="image/*"
                                    currentValue={editingSponsor.logo || ''}
                                    onChange={(url) => setEditingSponsor({...editingSponsor, logo: url})}
                                    placeholder="Upload sponsor logo"
                                    enableCrop={false}
                                    cropAspectRatio="3:2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea 
                                    value={editingSponsor.description} 
                                    onChange={e => setEditingSponsor({...editingSponsor, description: e.target.value})} 
                                    placeholder="Brief description of the sponsor" 
                                    className="w-full p-2 border rounded h-20" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input 
                                    type="url" 
                                    value={editingSponsor.website} 
                                    onChange={e => setEditingSponsor({...editingSponsor, website: e.target.value})} 
                                    placeholder="https://..." 
                                    className="w-full p-2 border rounded" 
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Social Media</label>
                                <div className="space-y-2">
                                    {[
                                        { key: 'twitter', label: 'Twitter', placeholder: '@company' },
                                        { key: 'facebook', label: 'Facebook', placeholder: 'facebook.com/company' },
                                        { key: 'instagram', label: 'Instagram', placeholder: '@company' },
                                        { key: 'youtube', label: 'YouTube', placeholder: 'youtube.com/company' }
                                    ].map(social => (
                                        <input 
                                            key={social.key}
                                            type="text" 
                                            value={editingSponsor.socialMedia?.[social.key] || ''} 
                                            onChange={e => setEditingSponsor({
                                                ...editingSponsor, 
                                                socialMedia: {
                                                    ...editingSponsor.socialMedia,
                                                    [social.key]: e.target.value
                                                }
                                            })} 
                                            placeholder={`${social.label}: ${social.placeholder}`} 
                                            className="w-full p-2 border rounded text-sm" 
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-4">
                                <button type="button" onClick={() => setEditingSponsor(null)} className="bg-slate-500 text-white px-4 py-2 rounded hover:bg-slate-600">
                                    Cancel
                                </button>
                                <button type="submit" className="bg-red-800 text-white px-4 py-2 rounded hover:bg-red-900">
                                    {editingSponsor.id ? 'Update Sponsor' : 'Add Sponsor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminPage = ({ teams, setTeams, players, setPlayers, leagueSchedule, gameTickerData, setGameTickerData, currentUser, users, setUsers, websiteStyle, setWebsiteStyle, leagueInfo, setLeagueInfo, seasons, setSeasons, currentSeason, setCurrentSeason, setLeagueSchedule, friends, setFriends, sponsors, setSponsors }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [usersSecurityTab, setUsersSecurityTab] = useState('users'); // New state for sub-tabs
    const [settingsTab, setSettingsTab] = useState('website'); // New state for settings sub-tabs

    // Check for default tab from localStorage (for navigation from Add League Event button)
    useEffect(() => {
        const defaultTab = window.localStorage.getItem('admin_default_tab');
        if (defaultTab) {
            setActiveTab(defaultTab);
            window.localStorage.removeItem('admin_default_tab'); // Clear after use
        }
    }, []);

    // Social Media Credentials State
    const [credentials, setCredentials] = useState(() => {
        const stored = localStorage.getItem('mlbl_social_credentials');
        return stored ? JSON.parse(stored) : {
            twitter: {
                api_key: '',
                api_secret: '',
                access_token: '',
                access_token_secret: '',
                bearer_token: '',
                connected: false
            },
            facebook: {
                app_id: '',
                app_secret: '',
                access_token: '',
                page_id: '',
                connected: false
            },
            instagram: {
                app_id: '',
                app_secret: '',
                access_token: '',
                business_account_id: '',
                redirect_uri: '',
                connected: false
            },
            youtube: {
                client_id: '',
                client_secret: '',
                refresh_token: '',
                channel_id: '',
                connected: false
            }
        };
    });

    // Save credentials to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('mlbl_social_credentials', JSON.stringify(credentials));
    }, [credentials]);

    const handleCredentialChange = (platform, field, value) => {
        setCredentials(prev => ({
            ...prev,
            [platform]: {
                ...prev[platform],
                [field]: value
            }
        }));
    };

    const handleTestConnection = async (platform) => {
        const platformCredentials = credentials[platform];
        
        // Check if required fields are filled
        const requiredFields = {
            twitter: ['api_key', 'api_secret', 'access_token', 'access_token_secret'],
            facebook: ['app_id', 'app_secret', 'access_token'],
            instagram: ['app_id', 'app_secret', 'access_token'],
            youtube: ['client_id', 'client_secret', 'refresh_token']
        };

        const required = requiredFields[platform] || [];
        const missingFields = required.filter(field => !platformCredentials[field]);

        if (missingFields.length > 0) {
            alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
            return;
        }

        try {
            // Simulate API test - in real implementation, this would make actual API calls
            console.log(`Testing ${platform} connection...`, platformCredentials);
            
            // Update connection status
            setCredentials(prev => ({
                ...prev,
                [platform]: {
                    ...prev[platform],
                    connected: true
                }
            }));

            alert(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connection successful!`);
        } catch (error) {
            console.error(`Error testing ${platform} connection:`, error);
            alert(`Failed to connect to ${platform}. Please check your credentials.`);
        }
    };

    // Use new permission system with consolidated structure
    const adminTabs = [
        { 
            id: 'dashboard', 
            label: 'Dashboard', 
            icon: <Home size={16} />, 
            permissions: ['system.admin_access'],
            description: 'Overview and statistics'
        },
        { 
            id: 'seasons', 
            label: 'Seasons', 
            icon: <Trophy size={16} />, 
            permissions: ['system.admin_access'],
            description: 'Manage league seasons and periods'
        },
        { 
            id: 'teams', 
            label: 'Teams', 
            icon: <Users size={16} />, 
            permissions: ['teams.view'],
            description: 'Manage teams and divisions'
        },
        { 
            id: 'friends', 
            label: 'Friends', 
            icon: <Users size={16} />, 
            permissions: ['system.admin_access'],
            description: 'Manage league friends and partners'
        },
        { 
            id: 'sponsors', 
            label: 'Sponsors', 
            icon: <Briefcase size={16} />, 
            permissions: ['system.admin_access'],
            description: 'Manage league sponsors and supporters'
        },
        { 
            id: 'players', 
            label: 'Players', 
            icon: <UserCheck size={16} />, 
            permissions: ['players.view'],
            description: 'Manage players and roster'
        },
        { 
            id: 'schedule', 
            label: 'Schedule & Events', 
            icon: <Calendar size={16} />, 
            permissions: ['events.view'],
            description: 'Manage league schedule and events'
        },
        { 
            id: 'game_ticker', 
            label: 'Game Ticker', 
            icon: <BarChart2 size={16} />, 
            permissions: ['events.edit'],
            description: 'Manage live scores and game ticker'
        },
        { 
            id: 'media', 
            label: 'Media Gallery', 
            icon: <ImageIcon size={16} />, 
            permissions: ['media.view'],
            description: 'Manage photos and videos'
        },
        { 
            id: 'social', 
            label: 'Social Media', 
            icon: <Share2 size={16} />, 
            permissions: ['media.edit'],
            description: 'Manage social media integration'
        },
        { 
            id: 'communications', 
            label: 'Communications', 
            icon: <Mail size={16} />, 
            permissions: ['system.admin_access'],
            description: 'Email and SMS messaging center'
        },
        { 
            id: 'website', 
            label: 'Website Design', 
            icon: <Palette size={16} />, 
            permissions: ['system.settings'],
            description: 'Customize website appearance and styling'
        },
        { 
            id: 'api', 
            label: 'API & Integrations', 
            icon: <Globe size={16} />, 
            permissions: ['system.settings'],
            description: 'API credentials and third-party integrations'
        },
        { 
            id: 'users', 
            label: 'User Management', 
            icon: <UserPlus size={16} />, 
            permissions: ['users.view'],
            description: 'Manage user access and permissions'
        },
        { 
            id: 'invites', 
            label: 'Invitations', 
            icon: <Mail size={16} />, 
            permissions: ['users.create'],
            description: 'Send invites and manage access requests'
        },
        { 
            id: 'settings', 
            label: 'League Settings', 
            icon: <Settings size={16} />, 
            permissions: ['system.settings'],
            description: 'Configure league information and general settings'
        }
    ];

    // Filter tabs based on permissions
    const visibleTabs = adminTabs.filter(tab => 
        hasAnyPermission(currentUser, tab.permissions)
    );

    // Set default tab to first available tab
    React.useEffect(() => {
        if (visibleTabs.length > 0 && !visibleTabs.find(t => t.id === activeTab)) {
            setActiveTab(visibleTabs[0].id);
        }
    }, [visibleTabs, activeTab]);

    const AdminTab = ({ tab }) => (
        <button 
            onClick={() => setActiveTab(tab.id)} 
            className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg font-semibold transition-all ${
                activeTab === tab.id 
                    ? 'bg-white text-blue-800 border-t-2 border-blue-600' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={tab.description}
        >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
        </button>
    );

    return (
        <div className="p-4 md:p-8 min-h-screen" style={getBackgroundStyle(websiteStyle)}>
            <div className="mb-6">
                <h1 className="text-4xl font-bold text-slate-800 mb-2 tracking-tight">
                    Admin Portal
                </h1>
                <p className="text-slate-600">
                    Welcome back, {currentUser.name}
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-slate-300 flex-wrap mb-6 overflow-x-auto">
                {visibleTabs.map(tab => (
                    <AdminTab key={tab.id} tab={tab} />
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-md min-h-[600px]">
                {activeTab === 'dashboard' && hasPermission(currentUser, 'system.admin_access') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Stats Cards */}
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600">Total Teams</p>
                                        <p className="text-2xl font-bold text-blue-800">{teams.filter(t => t.active).length}</p>
                                    </div>
                                    <Users className="text-blue-600" size={24} />
                                </div>
                            </div>
                            
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600">Active Players</p>
                                        <p className="text-2xl font-bold text-green-800">{players.filter(p => p.active).length}</p>
                                    </div>
                                    <UserCheck className="text-green-600" size={24} />
                                </div>
                            </div>
                            
                            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-purple-600">Total Users</p>
                                        <p className="text-2xl font-bold text-purple-800">{users.filter(u => u.active !== false).length}</p>
                                    </div>
                                    <Shield className="text-purple-600" size={24} />
                                </div>
                            </div>
                            
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-orange-600">This Month's Games</p>
                                        <p className="text-2xl font-bold text-orange-800">{gameTickerData.length}</p>
                                    </div>
                                    <Calendar className="text-orange-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        {/* Quick Actions */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <button 
                                    onClick={() => setActiveTab('teams')}
                                    className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Users className="mb-2" size={20} />
                                    <div className="text-sm font-semibold">Manage Teams</div>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('schedule')}
                                    className="p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <Calendar className="mb-2" size={20} />
                                    <div className="text-sm font-semibold">Add Event</div>
                                </button>
                                <button 
                                    onClick={() => setActiveTab('users')}
                                    className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                    <Shield className="mb-2" size={20} />
                                    <div className="text-sm font-semibold">Manage Users</div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'seasons' && hasPermission(currentUser, 'system.admin_access') && (
                    <div className="p-6">
                        <SeasonManager 
                            seasons={seasons}
                            setSeasons={setSeasons}
                            currentSeason={currentSeason}
                            setCurrentSeason={setCurrentSeason}
                            teams={teams}
                            setTeams={setTeams}
                            players={players}
                            setPlayers={setPlayers}
                            leagueSchedule={leagueSchedule}
                            setLeagueSchedule={setLeagueSchedule}
                        />
                    </div>
                )}

                {activeTab === 'friends' && hasPermission(currentUser, 'system.admin_access') && (
                    <div className="p-6">
                        <FriendsManager friends={friends} setFriends={setFriends} />
                    </div>
                )}

                {activeTab === 'sponsors' && hasPermission(currentUser, 'system.admin_access') && (
                    <div className="p-6">
                        <SponsorsManager sponsors={sponsors} setSponsors={setSponsors} />
                    </div>
                )}

                {activeTab === 'teams' && hasPermission(currentUser, 'teams.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Team Management</h2>
                        <TeamManager teams={teams} setTeams={setTeams} websiteStyle={websiteStyle} />
                    </div>
                )}

                {activeTab === 'players' && hasPermission(currentUser, 'players.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Player Management</h2>
                        <PlayerManager players={players} setPlayers={setPlayers} teams={teams} currentUser={currentUser} />
                    </div>
                )}

                {activeTab === 'schedule' && hasPermission(currentUser, 'events.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Schedule & Events Management</h2>
                        <LeagueCalendarManager teams={teams} setTeams={setTeams} websiteStyle={websiteStyle} />
                    </div>
                )}

                {activeTab === 'media' && hasPermission(currentUser, 'media.view') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Media Gallery</h2>
                        <div className="text-center py-8 text-slate-500">
                            <ImageIcon size={48} className="mx-auto mb-4" />
                            <p>Media gallery management coming soon...</p>
                            <p className="text-sm">This will consolidate photo and video management</p>
                        </div>
                    </div>
                )}

                {activeTab === 'social' && hasPermission(currentUser, 'media.edit') && (
                    <div className="p-6">
                        <SocialMediaManager 
                            leagueInfo={leagueInfo} 
                            setLeagueInfo={setLeagueInfo}
                            teams={teams}
                            setTeams={setTeams}
                            currentUser={currentUser}
                        />
                    </div>
                )}

                {activeTab === 'communications' && hasPermission(currentUser, 'system.admin_access') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Communications Center</h2>
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                            <div className="flex items-center mb-2">
                                <Mail className="mr-2 text-blue-600" size={20} />
                                <h3 className="text-lg font-semibold text-blue-800">Message Players & Staff</h3>
                            </div>
                            <p className="text-blue-600 text-sm">
                                Send emails and SMS to team members, coaches, or the entire league. 
                                Contact lists are automatically generated based on your selections.
                            </p>
                        </div>
                        <MessageCenter 
                            teams={teams} 
                            players={players} 
                            users={users} 
                            currentUser={currentUser} 
                        />
                    </div>
                )}

                {activeTab === 'website' && hasPermission(currentUser, 'system.settings') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">Website Design & Styling</h2>
                        <div className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <Palette className="mr-2" size={20} />
                                    Website Appearance
                                </h3>
                                <WebsiteStyleManager websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} />
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-3 flex items-center">
                                    <ImageIcon className="mr-2" size={20} />
                                    Banner & Logo Management
                                </h3>
                                <BannerUploadManager websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'api' && hasPermission(currentUser, 'system.settings') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">API & Integrations</h2>
                        <div className="space-y-6">
                            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                <div className="flex items-center mb-4">
                                    <Globe className="mr-2 text-blue-600" size={24} />
                                    <h3 className="text-lg font-semibold text-blue-800">Third-Party API Credentials</h3>
                                </div>
                                <p className="text-sm text-blue-600 mb-4">
                                    Configure API keys and credentials for external integrations
                                </p>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white p-4 rounded-md border">
                                        <h4 className="font-medium text-slate-800 mb-2">Social Media APIs</h4>
                                        <p className="text-sm text-slate-600 mb-3">Twitter, Instagram, Facebook integration keys</p>
                                        <button className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">
                                            Configure Social APIs
                                        </button>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-md border">
                                        <h4 className="font-medium text-slate-800 mb-2">Email & SMS APIs</h4>
                                        <p className="text-sm text-slate-600 mb-3">SendGrid, Twilio, Mailgun credentials</p>
                                        <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                                            Configure Messaging APIs
                                        </button>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-md border">
                                        <h4 className="font-medium text-slate-800 mb-2">Analytics & Tracking</h4>
                                        <p className="text-sm text-slate-600 mb-3">Google Analytics, tracking codes</p>
                                        <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700">
                                            Configure Analytics
                                        </button>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-md border">
                                        <h4 className="font-medium text-slate-800 mb-2">Payment Processing</h4>
                                        <p className="text-sm text-slate-600 mb-3">Stripe, PayPal integration</p>
                                        <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700">
                                            Configure Payments
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 p-6 rounded-lg border">
                                <h3 className="text-lg font-semibold mb-3">API Documentation & Testing</h3>
                                <p className="text-slate-600 mb-4">
                                    Access API documentation and test endpoints
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700">
                                        View API Docs
                                    </button>
                                    <button className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700">
                                        Test Endpoints
                                    </button>
                                    <button className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700">
                                        Generate API Keys
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'game_ticker' && hasPermission(currentUser, 'events.edit') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Game Ticker Management</h2>
                        <ScoreManager leagueSchedule={leagueSchedule} gameTickerData={gameTickerData} setGameTickerData={setGameTickerData} teams={teams} />
                    </div>
                )}

                {activeTab === 'users' && (hasPermission(currentUser, 'users.view') || hasPermission(currentUser, 'system.roles')) && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold mb-2">Users & Security</h2>
                            <div className="flex space-x-4 border-b">
                                <button 
                                    className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                                        usersSecurityTab === 'users' 
                                            ? 'border-blue-600 text-blue-600' 
                                            : 'border-transparent text-slate-600 hover:text-blue-600'
                                    }`}
                                    onClick={() => setUsersSecurityTab('users')}
                                >
                                    Users
                                </button>
                                {hasPermission(currentUser, 'system.roles') && (
                                    <button 
                                        className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
                                            usersSecurityTab === 'roles' 
                                                ? 'border-blue-600 text-blue-600' 
                                                : 'border-transparent text-slate-600 hover:text-blue-600'
                                        }`}
                                        onClick={() => setUsersSecurityTab('roles')}
                                    >
                                        Roles & Permissions
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        {/* Tab Content */}
                        {usersSecurityTab === 'users' && hasPermission(currentUser, 'users.view') && (
                            <UserManager users={users} setUsers={setUsers} teams={teams} />
                        )}
                        
                        {usersSecurityTab === 'roles' && hasPermission(currentUser, 'system.roles') && (
                            <RoleManager users={users} setUsers={setUsers} />
                        )}
                    </div>
                )}

                {activeTab === 'invites' && hasPermission(currentUser, 'users.create') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Invitations & Access Requests</h2>
                        <div className="text-center py-8 text-slate-500">
                            <Mail size={48} className="mx-auto mb-4" />
                            <p>Invitation system coming soon...</p>
                            <p className="text-sm">Send invites and manage access requests</p>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && hasPermission(currentUser, 'system.settings') && (
                    <div className="p-6">
                        <h2 className="text-2xl font-bold mb-6">League Settings</h2>
                        <div className="bg-slate-50 p-6 rounded-lg border">
                            <h3 className="text-lg font-semibold mb-4 flex items-center">
                                <Trophy className="mr-2" size={20} />
                                League Information & Configuration
                            </h3>
                            <LeagueInfoManager leagueInfo={leagueInfo} setLeagueInfo={setLeagueInfo} websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} />
                        </div>
                    </div>
                )}

                {/* Social Media Management */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                        <Settings className="mr-2" size={20} />
                        Social Media Management
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 rounded-full p-2">
                                <Zap className="text-white" size={16} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-blue-800">Advanced Social Media Features</h4>
                                <p className="text-sm text-blue-700">
                                    Set up API credentials to post directly from the app, schedule posts, and manage all your social platforms in one place.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Access Denied for tabs without permission */}
                {!hasAnyPermission(currentUser, adminTabs.find(t => t.id === activeTab)?.permissions || []) && (
                    <div className="p-6 text-center">
                        <Shield size={48} className="mx-auto mb-4 text-slate-400" />
                        <h3 className="text-lg font-semibold text-slate-600 mb-2">Access Denied</h3>
                        <p className="text-slate-500">You don't have permission to view this section.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- API SERVICE LAYER ---
const API_BASE = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:8001/api' 
    : (process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:8001/api');

const apiService = {
    async loadLeagueData() {
        try {
            const response = await fetch(`${API_BASE}/league-data`);
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.warn('Failed to load league data from API, using localStorage fallback');
                return null;
            }
        } catch (error) {
            console.warn('API unavailable, using localStorage fallback:', error);
            return null;
        }
    },

    async saveLeagueData(data) {
        try {
            const response = await fetch(`${API_BASE}/league-data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (response.ok) {
                console.log('✅ League data saved to database');
                return true;
            } else {
                console.warn('Failed to save to database, falling back to localStorage');
                return false;
            }
        } catch (error) {
            console.warn('API save failed, falling back to localStorage:', error);
            return false;
        }
    },

    async updateSpecificData(dataType, data) {
        try {
            const response = await fetch(`${API_BASE}/league-data/${dataType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            return response.ok;
        } catch (error) {
            console.warn(`Failed to update ${dataType}:`, error);
            return false;
        }
    }
};

// --- LOCAL STORAGE HELPERS (Fallback) ---
// Enhanced data loading with API + localStorage fallback
const getStoredData = (key, defaultValue) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.warn(`Error loading ${key} from localStorage:`, error);
        return defaultValue;
    }
};

const setStoredData = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error saving ${key} to localStorage:`, error);
    }
};

// Initialize data with API-first approach
const initializeData = async (key, defaultValue) => {
    // Try to load from API first
    const apiData = await apiService.loadLeagueData();
    if (apiData && apiData[key]) {
        // Save to localStorage as cache
        setStoredData(`mlbl_${key}`, apiData[key]);
        return apiData[key];
    }
    
    // Fallback to localStorage
    return getStoredData(`mlbl_${key}`, defaultValue);
};

// ===== USER-PLAYER LINKING & MESSAGING UTILITIES =====

/**
 * Links players with users based on email matching and adds userId field
 * @param {Array} players - Array of player objects
 * @param {Array} users - Array of user objects  
 * @returns {Array} - Players array with userId field added
 */
const linkPlayersWithUsers = (players, users) => {
    return players.map(player => {
        // Find matching user by email (case insensitive)
        const matchingUser = users.find(user => 
            user.email && player.email && 
            user.email.toLowerCase() === player.email.toLowerCase()
        );
        
        return {
            ...player,
            userId: matchingUser ? matchingUser.id : null,
            // Keep original email for redundancy
        };
    });
};

/**
 * Get all players for a team with their linked user data for messaging
 * @param {string} teamId - Team ID to get players for
 * @param {Array} players - Players array
 * @param {Array} users - Users array
 * @returns {Array} - Players with linked user data
 */
const getTeamPlayersForMessaging = (teamId, players, users) => {
    return players
        .filter(player => player.teams && player.teams.includes(teamId))
        .map(player => {
            const linkedUser = player.userId ? users.find(u => u.id === player.userId) : null;
            return {
                ...player,
                user: linkedUser,
                // Primary contact info (prefer user data, fallback to player data)
                primaryEmail: linkedUser?.email || player.email,
                primaryPhone: linkedUser?.phone || player.phone,
                canReceiveMessages: !!(linkedUser?.email || player.email), // Has some contact method
                hasUserAccount: !!linkedUser
            };
        });
};

/**
 * Get all users by role for messaging (coaches, admins, etc.)
 * @param {string|Array} roles - Single role string or array of roles
 * @param {Array} users - Users array
 * @returns {Array} - Filtered users with specified roles
 */
const getUsersByRole = (roles, users) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return users.filter(user => 
        user.status === 'active' && 
        user.roles && 
        roleArray.some(role => user.roles.includes(role))
    );
};

/**
 * Get all contacts for a team (players + coaches + team-specific admins)
 * @param {string} teamId - Team ID
 * @param {Array} players - Players array
 * @param {Array} users - Users array
 * @returns {Object} - Categorized contacts for the team
 */
const getTeamContacts = (teamId, players, users) => {
    const teamPlayers = getTeamPlayersForMessaging(teamId, players, users);
    const teamCoaches = users.filter(user => 
        user.status === 'active' && 
        user.teamId === teamId && 
        (user.roles.includes('coach') || user.roles.includes('player/coach'))
    );
    const admins = getUsersByRole('admin', users);
    
    return {
        players: teamPlayers,
        coaches: teamCoaches,
        admins: admins,
        all: [
            ...teamPlayers.map(p => ({ 
                type: 'player', 
                name: `${p.firstName} ${p.lastName}`, 
                email: p.primaryEmail, 
                phone: p.primaryPhone,
                userId: p.userId,
                playerId: p.id
            })),
            ...teamCoaches.map(c => ({ 
                type: 'coach', 
                name: c.name, 
                email: c.email, 
                phone: c.phone,
                userId: c.id
            })),
            ...admins.map(a => ({ 
                type: 'admin', 
                name: a.name, 
                email: a.email, 
                phone: a.phone,
                userId: a.id
            }))
        ].filter(contact => contact.email) // Only include contacts with email
    };
};

/**
 * Get league-wide contacts for mass messaging
 * @param {Array} players - Players array
 * @param {Array} users - Users array
 * @returns {Object} - All league contacts categorized
 */
const getLeagueContacts = (players, users) => {
    const allPlayersWithUsers = players.map(player => {
        const linkedUser = player.userId ? users.find(u => u.id === player.userId) : null;
        return {
            ...player,
            user: linkedUser,
            primaryEmail: linkedUser?.email || player.email,
            primaryPhone: linkedUser?.phone || player.phone
        };
    }).filter(p => p.primaryEmail);
    
    const allCoaches = getUsersByRole(['coach', 'player/coach'], users);
    const allAdmins = getUsersByRole('admin', users);
    
    return {
        allPlayers: allPlayersWithUsers,
        allCoaches: allCoaches,
        allAdmins: allAdmins,
        everyone: [
            ...allPlayersWithUsers.map(p => ({ 
                type: 'player', 
                name: `${p.firstName} ${p.lastName}`, 
                email: p.primaryEmail, 
                phone: p.primaryPhone,
                teams: p.teams,
                userId: p.userId,
                playerId: p.id
            })),
            ...allCoaches.map(c => ({ 
                type: 'coach', 
                name: c.name, 
                email: c.email, 
                phone: c.phone,
                teamId: c.teamId,
                userId: c.id
            })),
            ...allAdmins.map(a => ({ 
                type: 'admin', 
                name: a.name, 
                email: a.email, 
                phone: a.phone,
                userId: a.id
            }))
        ]
    };
};

// ===== MESSAGING CENTER COMPONENT (DEMO) =====

const MessageCenter = ({ teams, players, users, currentUser }) => {
    const [selectedTeam, setSelectedTeam] = useState('');
    const [messageType, setMessageType] = useState('team'); // 'team', 'role', 'league'
    const [selectedRole, setSelectedRole] = useState('player');
    const [contacts, setContacts] = useState([]);

    // Update contacts when selections change
    useEffect(() => {
        let newContacts = [];
        
        if (messageType === 'team' && selectedTeam) {
            const teamContacts = getTeamContacts(selectedTeam, players, users);
            newContacts = teamContacts.all;
        } else if (messageType === 'role') {
            const roleUsers = getUsersByRole(selectedRole, users);
            newContacts = roleUsers.map(user => ({
                type: user.roles.includes('admin') ? 'admin' : selectedRole,
                name: user.name,
                email: user.email,
                phone: user.phone,
                userId: user.id
            }));
        } else if (messageType === 'league') {
            const leagueContacts = getLeagueContacts(players, users);
            newContacts = leagueContacts.everyone;
        }
        
        setContacts(newContacts);
    }, [messageType, selectedTeam, selectedRole, players, users]);

    return (
        <div className="p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">📧 Message Center</h2>
            
            {/* Message Type Selection */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">Message Scope</label>
                <div className="flex space-x-4">
                    <label className="flex items-center">
                        <input 
                            type="radio" 
                            value="team" 
                            checked={messageType === 'team'} 
                            onChange={(e) => setMessageType(e.target.value)}
                            className="mr-2"
                        />
                        Team
                    </label>
                    <label className="flex items-center">
                        <input 
                            type="radio" 
                            value="role" 
                            checked={messageType === 'role'} 
                            onChange={(e) => setMessageType(e.target.value)}
                            className="mr-2"
                        />
                        By Role
                    </label>
                    <label className="flex items-center">
                        <input 
                            type="radio" 
                            value="league" 
                            checked={messageType === 'league'} 
                            onChange={(e) => setMessageType(e.target.value)}
                            className="mr-2"
                        />
                        League-wide
                    </label>
                </div>
            </div>

            {/* Team Selection */}
            {messageType === 'team' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Team</label>
                    <select 
                        value={selectedTeam} 
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md"
                    >
                        <option value="">Choose a team...</option>
                        {teams.filter(t => t.active).map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </select>
                </div>
            )}

            {/* Role Selection */}
            {messageType === 'role' && (
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Role</label>
                    <select 
                        value={selectedRole} 
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-md"
                    >
                        <option value="player">All Players</option>
                        <option value="coach">All Coaches</option>
                        <option value="admin">All Admins</option>
                        <option value="player/coach">Player/Coaches</option>
                    </select>
                </div>
            )}

            {/* Contact List Preview */}
            <div className="mt-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">
                    Recipients ({contacts.length})
                </h3>
                
                {contacts.length > 0 ? (
                    <div className="max-h-64 overflow-y-auto bg-slate-50 rounded-md p-4">
                        {contacts.map((contact, index) => (
                            <div key={`${contact.userId}-${contact.playerId}-${index}`} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-b-0">
                                <div>
                                    <span className="font-medium text-slate-800">{contact.name}</span>
                                    <span className={`ml-2 px-2 py-1 rounded text-xs font-semibold ${
                                        contact.type === 'player' ? 'bg-blue-100 text-blue-800' :
                                        contact.type === 'coach' ? 'bg-green-100 text-green-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {contact.type}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-600">
                                    {contact.email}
                                    {contact.phone && <div>📱 {contact.phone}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        <Mail className="mx-auto mb-2" size={48} />
                        <p>No contacts found for the selected criteria</p>
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {contacts.length > 0 && (
                <div className="mt-6 flex space-x-3">
                    <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center">
                        <Mail className="mr-2" size={16} />
                        Send Email ({contacts.length})
                    </button>
                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center">
                        <MessageSquare className="mr-2" size={16} />
                        Send SMS ({contacts.filter(c => c.phone).length})
                    </button>
                    <button className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700">
                        Export List
                    </button>
                </div>
            )}
        </div>
    );
};

// --- Main App Component ---
function App() {
    const [page, setPage] = useState('home');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(window.innerWidth > 768);
    const [showLogin, setShowLogin] = useState(false);
    const [authMode, setAuthMode] = useState('login'); // 'login', 'register'
    const [registrationData, setRegistrationData] = useState({
        name: '',
        email: '',
        preferredRole: 'player',
        teamId: '',
        phone: '',
        reasonForJoining: ''
    });

    // Data loading state
    const [dataLoading, setDataLoading] = useState(true);

    const [teams, setTeams] = useState([]);
    const [players, setPlayers] = useState([]);
    const [gameTickerData, setGameTickerData] = useState([]);
    const [leagueSchedule, setLeagueSchedule] = useState([]);
    const [users, setUsers] = useState([]);
    
    // SEASONS INFRASTRUCTURE - NEW STATE
    const [seasons, setSeasons] = useState([]);
    const [currentSeason, setCurrentSeason] = useState(null);
    
    // FRIENDS AND SPONSORS SYSTEM - NEW STATE  
    const [friends, setFriends] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    
    // SEASONS INFRASTRUCTURE - Data Migration & Setup
    const migrateToSeasons = useCallback(() => {
        // If we have teams/schedule but no seasons, create initial season
        if (teams.length > 0 && seasons.length === 0) {
            const initialSeason = {
                id: 'season-current-2024',
                name: 'Current Season 2024',
                startDate: '2024-01-01',
                endDate: '2024-12-31', 
                status: 'active',
                teams: teams.map(team => ({
                    ...team,
                    seasonRoster: players
                        .filter(p => p.teams?.includes(team.id))
                        .map(p => ({
                            playerId: p.id,
                            number: p.number,
                            positions: p.positions,
                            active: p.active
                        }))
                })),
                schedule: leagueSchedule,
                standings: teams.map(team => ({
                    teamId: team.id,
                    wins: team.wins || 0,
                    losses: team.losses || 0,
                    ties: team.ties || 0,
                    goalsFor: team.pf || 0,
                    goalsAgainst: team.pa || 0
                })),
                playoffs: { bracket: null, games: [] }
            };
            
            setSeasons([initialSeason]);
            setCurrentSeason(initialSeason.id);
            
            console.log('📅 Migrated existing data to seasons structure');
        }
    }, [teams, seasons, players, leagueSchedule, setSeasons, setCurrentSeason]);

    // Auto-migrate on data load
    useEffect(() => {
        if (!dataLoading) {
            migrateToSeasons();
        }
    }, [dataLoading, migrateToSeasons]);

    const [leagueInfo, setLeagueInfo] = useState({
        name: "Men's Lacrosse Beer League",
        contactEmail: "admin@mlbl.org",
        social: { twitter: '#', instagram: '#', facebook: '#' }
    });
    
    // News system state (team-specific news) 
    const [teamNews, setTeamNews] = useState({}); // Object keyed by teamId
    const [selectedNewsItem, setSelectedNewsItem] = useState(null);
    const [newsLoading, setNewsLoading] = useState(true);
    
    // Helper functions for team-specific news
    const getTeamNewsItems = (teamId) => teamNews[teamId] || [];
    const setTeamNewsItems = (teamId, newsItems) => {
        setTeamNews(prev => ({ ...prev, [teamId]: newsItems }));
    };
    const addTeamNewsItem = (teamId, newsItem) => {
        setTeamNews(prev => ({ 
            ...prev, 
            [teamId]: [...(prev[teamId] || []), newsItem] 
        }));
    };
    const updateTeamNewsItem = (teamId, newsId, updatedItem) => {
        setTeamNews(prev => ({ 
            ...prev, 
            [teamId]: (prev[teamId] || []).map(item => 
                item.id === newsId ? { ...item, ...updatedItem } : item
            )
        }));
    };
    const deleteTeamNewsItem = (teamId, newsId) => {
        setTeamNews(prev => ({ 
            ...prev, 
            [teamId]: (prev[teamId] || []).filter(item => item.id !== newsId)
        }));
    };
    
    // Get all news items from all teams for the homepage ticker
    const getAllNewsItems = () => {
        return Object.values(teamNews).flat().sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
    };
    const [websiteStyle, setWebsiteStyle] = useState({
        logoUrl: MlblLogo,
        primaryColor: '#1e293b', // slate-800
        accentColor: '#991b1b', // red-800
        logoStyle: 'contain',
        // Page & Text Colors
        pageBackgroundColor: '#f1f5f9', // slate-100
        textColor: '#1e293b', // slate-800
        headingColor: '#0f172a', // slate-900
        linkColor: '#2563eb', // blue-600
        // Form styling
        formBackgroundColor: '#f8fafc', // slate-50
        // Background image settings
        backgroundImage: '',
        backgroundMode: 'cover', // cover, contain, tile
        backgroundOpacity: 0.1, // 0-1 for overlay opacity
        // Top Banner/Header settings  
        bannerText: 'MLBL',
        bannerColor: '#1e293b', // default to primaryColor
        bannerImage: '',
        bannerMode: 'cover', // cover, contain, repeat
        bannerOpacity: 0.3,
        bannerLogo: '',
        bannerLogoSize: 'medium', // small, medium, large
        bannerLogoPosition: 'left', // left, center, right
        // Music settings
        globalMusicUrl: '',
        // Sidebar settings
        sidebarImage: '',
        sidebarOpacity: 0.2,
        sidebarMode: 'cover', // cover, contain, repeat
        // Game Ticker settings (moved from LeagueInfoManager)
        tickerColor: '#1e293b',
        tickerItemColor: '#334155',
        tickerBorderColor: '#475569',
        tickerTextColor: '#94a3b8',
        // Top Bar/News Ticker Text Customization
        newsLabel: 'NEWS',
        // Logo Overlay Settings
        overlayLogo: '',
        overlayLogoAlignment: 'center', // left, center, right
        overlayLogoSize: 'medium' // small, medium, large
    });

    // Image popup state for galleries
    const [selectedImagePopup, setSelectedImagePopup] = useState(null);
    const [editingPlayerStats, setEditingPlayerStats] = useState(false);
    const [manageScheduleExpanded, setManageScheduleExpanded] = useState(false);

    // Load data from API on component mount
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const apiData = await apiService.loadLeagueData();
                
                if (apiData) {
                    console.log('✅ Loaded data from API');
                    // Load from API
                    setTeams(apiData.teams || initialTeams);
                    
                    // Link players with users and update players data
                    const loadedPlayers = apiData.players || initialPlayersList;
                    const loadedUsers = apiData.users || initialMockUsers;
                    const linkedPlayers = linkPlayersWithUsers(loadedPlayers, loadedUsers);
                    
                    setPlayers(linkedPlayers);
                    setGameTickerData(apiData.gameTickerData || initialGameTickerData);
                    setLeagueSchedule(apiData.leagueSchedule || initialLeagueSchedule);
                    setUsers(loadedUsers);
                    setLeagueInfo(apiData.leagueInfo || {
                        name: "Men's Lacrosse Beer League",
                        contactEmail: "admin@mlbl.org",
                        social: { twitter: '#', instagram: '#', facebook: '#' }
                    });
                    // Fix data persistence bug: Only use apiData.websiteStyle if it has actual properties
                    const hasWebsiteStyleData = apiData.websiteStyle && Object.keys(apiData.websiteStyle).length > 0;
                    setWebsiteStyle(hasWebsiteStyleData ? {
                        ...websiteStyle, // Start with defaults
                        ...apiData.websiteStyle // Overlay saved data
                    } : websiteStyle);
                    
                    // Load seasons data
                    if (apiData.seasons) {
                        setSeasons(apiData.seasons);
                        setStoredData('mlbl_seasons', apiData.seasons);
                    }
                    if (apiData.currentSeason) {
                        setCurrentSeason(apiData.currentSeason);
                        setStoredData('mlbl_currentSeason', apiData.currentSeason);
                    }
                    
                    // Also save to localStorage as cache
                    setStoredData('mlbl_teams', apiData.teams || initialTeams);
                    setStoredData('mlbl_players', linkedPlayers);
                    setStoredData('mlbl_gameTickerData', apiData.gameTickerData || initialGameTickerData);
                    setStoredData('mlbl_leagueSchedule', apiData.leagueSchedule || initialLeagueSchedule);
                    setStoredData('mlbl_users', loadedUsers);
                    setStoredData('mlbl_leagueInfo', apiData.leagueInfo || leagueInfo);
                    setStoredData('mlbl_websiteStyle', hasWebsiteStyleData ? apiData.websiteStyle : websiteStyle);
                } else {
                    console.log('📦 Loading from localStorage fallback');
                    // Fallback to localStorage
                    const storedPlayers = getStoredData('mlbl_players', initialPlayersList);
                    const storedUsers = getStoredData('mlbl_users', initialMockUsers);
                    const linkedPlayers = linkPlayersWithUsers(storedPlayers, storedUsers);
                    
                    setTeams(getStoredData('mlbl_teams', initialTeams));
                    setPlayers(linkedPlayers);
                    setGameTickerData(getStoredData('mlbl_gameTickerData', initialGameTickerData));
                    setLeagueSchedule(getStoredData('mlbl_leagueSchedule', initialLeagueSchedule));
                    setUsers(storedUsers);
                    setLeagueInfo(getStoredData('mlbl_leagueInfo', leagueInfo));
                    // Fix localStorage fallback for websiteStyle persistence
                    const storedWebsiteStyle = getStoredData('mlbl_websiteStyle', null);
                    const hasStoredWebsiteStyleData = storedWebsiteStyle && Object.keys(storedWebsiteStyle).length > 0;
                    setWebsiteStyle(hasStoredWebsiteStyleData ? {
                        ...websiteStyle, // Start with defaults
                        ...storedWebsiteStyle // Overlay saved data
                    } : websiteStyle);
                    
                    // Load seasons from localStorage
                    const storedSeasons = getStoredData('mlbl_seasons', []);
                    const storedCurrentSeason = getStoredData('mlbl_currentSeason', null);
                    if (storedSeasons.length > 0) {
                        setSeasons(storedSeasons);
                    }
                    if (storedCurrentSeason) {
                        setCurrentSeason(storedCurrentSeason);
                    }
                }
            } catch (error) {
                console.error('Error loading data:', error);
                // Load default values with linking
                const linkedPlayers = linkPlayersWithUsers(initialPlayersList, initialMockUsers);
                setTeams(initialTeams);
                setPlayers(linkedPlayers);
                setGameTickerData(initialGameTickerData);
                setLeagueSchedule(initialLeagueSchedule);
                setUsers(initialMockUsers);
            } finally {
                setDataLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // Global music player state
    const [musicState, setMusicState] = useState({
        currentTrack: null, // { url: string, title: string, teamId?: string }
        isPlaying: false,
        audioRef: null
    });

    // Save data to both API and localStorage whenever it changes
    const saveDataToAPI = async (dataType, data) => {
        const success = await apiService.updateSpecificData(dataType, data);
        if (!success) {
            // Fallback to localStorage if API fails
            setStoredData(`mlbl_${dataType}`, data);
        }
    };

    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('teams', teams);
            setStoredData('mlbl_teams', teams);
        }
    }, [teams, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('players', players);
            setStoredData('mlbl_players', players);
        }
    }, [players, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('gameTickerData', gameTickerData);
            setStoredData('mlbl_gameTickerData', gameTickerData);
        }
    }, [gameTickerData, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('leagueSchedule', leagueSchedule);
            setStoredData('mlbl_leagueSchedule', leagueSchedule);
        }
    }, [leagueSchedule, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('users', users);
            setStoredData('mlbl_users', users);
        }
    }, [users, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('leagueInfo', leagueInfo);
            setStoredData('mlbl_leagueInfo', leagueInfo);
        }
    }, [leagueInfo, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading) {
            saveDataToAPI('websiteStyle', websiteStyle);
            setStoredData('mlbl_websiteStyle', websiteStyle);
        }
    }, [websiteStyle, dataLoading]);

    // SEASONS AUTO-SAVE
    useEffect(() => { 
        if (!dataLoading && seasons.length > 0) {
            saveDataToAPI('seasons', seasons);
            setStoredData('mlbl_seasons', seasons);
        }
    }, [seasons, dataLoading]);
    
    useEffect(() => { 
        if (!dataLoading && currentSeason) {
            saveDataToAPI('currentSeason', currentSeason);
            setStoredData('mlbl_currentSeason', currentSeason);
        }
    }, [currentSeason, dataLoading]);

    // Hash routing implementation
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.substring(1); // Remove the '#'
            console.log('Hash change detected:', hash, 'Teams loaded:', teams.length);
            
            if (hash.startsWith('team=')) {
                const teamId = hash.replace('team=', '');
                const team = teams.find(t => t.id === teamId);
                console.log('Looking for team:', teamId, 'Found:', !!team);
                if (team && teams.length > 0) {
                    setPage('team');
                    setSelectedTeam(teamId);
                    console.log('Team page set:', teamId);
                }
            } else if (hash === 'home' || hash === '') {
                // Fix: Handle home navigation properly
                setPage('home');
                setSelectedTeam(null);
                console.log('Home page set');
            } else if (hash) {
                // Handle other page navigation
                setPage(hash);
                setSelectedTeam(null);
                console.log('Page set:', hash);
            }
        };

        // Fix: Set up routing immediately, don't wait for teams to load
        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
        
        // Parse initial hash on mount
        handleHashChange();

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, [teams]); // Keep teams in dependency to handle team navigation when teams load

    // Load news data
    useEffect(() => {
        const loadNewsData = async () => {
            try {
                const apiData = await apiService.loadLeagueData();
                if (apiData && apiData.teamNews) {
                    setTeamNews(apiData.teamNews);
                    setStoredData('mlbl_teamNews', apiData.teamNews);
                } else {
                    // Fallback to localStorage or convert old newsItems to team-specific
                    let fallbackTeamNews = getStoredData('mlbl_teamNews', {});
                    
                    // If we have old newsItems, convert them to team-specific format
                    const oldNewsItems = getStoredData('mlbl_newsItems', []);
                    if (oldNewsItems.length > 0 && Object.keys(fallbackTeamNews).length === 0) {
                        // Put all old news under 'league' key
                        fallbackTeamNews = { league: oldNewsItems };
                    }
                    
                    // If still no news, create some default league news
                    if (Object.keys(fallbackTeamNews).length === 0) {
                        fallbackTeamNews = {
                            league: [
                                { 
                                    id: 1, 
                                    type: 'text',
                                    heading: "Welcome to MLBL",
                                    text: "🥍 Welcome to the Mid-Ohio Lacrosse League!", 
                                    comments: "Stay tuned for the latest updates, game schedules, and team news.",
                                    date: "2025-08-05"
                                },
                                { 
                                    id: 2, 
                                    type: 'text',
                                    heading: "Season Updates",
                                    text: "📅 Season schedules are now available", 
                                    comments: "Check your team pages for the complete season schedule and upcoming events.",
                                    date: "2025-08-04"
                                },
                                { 
                                    id: 3, 
                                    type: 'text',
                                    heading: "Championship News",
                                    text: "🏆 Championship brackets released", 
                                    comments: "The playoff brackets are now available. Good luck to all teams!",
                                    date: "2025-08-03"
                                }
                            ]
                        };
                    }
                    
                    setTeamNews(fallbackTeamNews);
                }
            } catch (error) {
                console.error('Error loading news data:', error);
            } finally {
                setNewsLoading(false);
            }
        };

        loadNewsData();
    }, []);

    // Save team news when they change
    useEffect(() => { 
        if (!newsLoading && Object.keys(teamNews).length > 0) {
            apiService.updateSpecificData('teamNews', teamNews);
            setStoredData('mlbl_teamNews', teamNews);
        }
    }, [teamNews, newsLoading]);

    // Sidebar collapsible sections state
    const [sidebarSections, setSidebarSections] = useState({
        fieldLacrosse: true,
        boxLacrosse: true
    });

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Call on initial load
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Login form component to prevent re-renders
    const LoginForm = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');

        const handleSubmit = (e) => {
            e.preventDefault();
            
            if (!email || !password) {
                alert('Please enter both email and password.');
                return;
            }

            // Find user by email
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'active');
            
            if (!user) {
                alert('Invalid email or account not active. Please check your credentials or contact an admin.');
                return;
            }

            // For demo purposes, accept any password for existing users
            setCurrentUser(user);
            setShowLogin(false);
            setEmail('');
            setPassword('');
        };

        return (
            <form onSubmit={handleSubmit} className="mb-6">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email address"
                        required
                    />
                </div>
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your password"
                        required
                    />
                </div>
                <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                    Login
                </button>
            </form>
        );
    };

    // Quick login function for demo buttons
    const handleQuickLogin = (user) => {
        setCurrentUser(user);
        setShowLogin(false);
    };

    const handleLogout = () => {
        setCurrentUser(null);
    };
    
    // RSVP Handler
    const handleUpdateRSVP = (eventId, responses) => {
        setTeams(prevTeams => 
            prevTeams.map(team => ({
                ...team,
                calendar: (team.calendar || []).map(event => 
                    event.id === eventId 
                        ? {
                            ...event,
                            rsvp: {
                                ...event.rsvp,
                                responses: responses
                            }
                        }
                        : event
                )
            }))
        );
    };
    
    // Event Notification System
    const sendEventNotification = (event, type = 'reminder') => {
        // This would integrate with email/SMS service
        console.log(`Sending ${type} notification for event: ${event.title}`);
        
        // For demo purposes, show a notification
        alert(`${type.charAt(0).toUpperCase() + type.slice(1)} notification sent for "${event.title}"`);
        
        // Update reminders sent
        const notification = {
            type: type,
            sentAt: new Date().toISOString(),
            recipients: event.rsvp?.responses?.map(r => r.userId) || []
        };
        
        setTeams(prevTeams => 
            prevTeams.map(team => ({
                ...team,
                calendar: (team.calendar || []).map(e => 
                    e.id === event.id 
                        ? {
                            ...e,
                            rsvp: {
                                ...e.rsvp,
                                remindersSent: [...(e.rsvp?.remindersSent || []), notification]
                            }
                        }
                        : e
                )
            }))
        );
    };
    
    const navigate = (targetPage, teamId = null) => {
        // Use hash routing for navigation
        if (targetPage === 'team' && teamId) {
            window.location.hash = `team=${teamId}`;
        } else {
            window.location.hash = targetPage;
        }
        // State will be updated by hashchange listener
        if (window.innerWidth < 768) setIsMenuOpen(false);
    };

    const handleAdminNav = () => {
        if (!currentUser) return;
        if (currentUser.roles.includes('admin')) {
            navigate('admin');
        } else if (currentUser.roles.includes('coach') || currentUser.roles.includes('player/coach')) {
            navigate('team', currentUser.teamId);
        }
    };

    // Music control functions
    const playMusic = (url, title, teamId = null) => {
        // Stop current music if playing
        if (musicState.audioRef) {
            musicState.audioRef.pause();
        }
        
        setMusicState({
            currentTrack: { url, title, teamId },
            isPlaying: true,
            audioRef: musicState.audioRef
        });
    };

    const stopAllMusic = () => {
        if (musicState.audioRef) {
            musicState.audioRef.pause();
            musicState.audioRef.currentTime = 0;
        }
        setMusicState(prev => ({
            ...prev,
            currentTrack: null,
            isPlaying: false
        }));
    };

    // Registration handlers
    const handleRegistration = () => {
        // Validation
        if (!registrationData.name || !registrationData.email || !registrationData.reasonForJoining) {
            alert('Please fill in all required fields (Name, Email, and Reason for Joining).');
            return;
        }

        const newUser = {
            id: Date.now(),
            name: registrationData.name,
            email: registrationData.email,
            teamId: registrationData.teamId || null,
            preferredRole: registrationData.preferredRole,
            phone: registrationData.phone,
            reasonForJoining: registrationData.reasonForJoining,
            roles: [], // Empty until approved
            roleIds: [], // Empty until approved
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        setUsers(prev => [...prev, newUser]);
        
        // Reset form
        setRegistrationData({
            name: '',
            email: '',
            preferredRole: 'player',
            teamId: '',
            phone: '',
            reasonForJoining: ''
        });
        
        setAuthMode('login');
        alert('Registration submitted successfully! An admin will review your application and notify you when approved. Note: Email notifications are not currently configured.');
    };

    // Reset registration data when closing auth modal
    const handleAuthModalClose = React.useCallback(() => {
        setShowLogin(false);
        setAuthMode('login');
        setRegistrationData({
            name: '',
            email: '',
            preferredRole: 'player',
            teamId: '',
            phone: '',
            reasonForJoining: ''
        });
    }, []);

    const AuthModal = React.useCallback(() => (
        <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
            onClick={handleAuthModalClose}
        >
            <div 
                className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {authMode === 'login' ? (
                    // Login View
                    <div className="p-6">
                        <h2 className="text-2xl font-bold text-center mb-6">Welcome to MLBL</h2>
                        
                        {/* Email/Password Login Form */}
                        <LoginForm />

                        {/* Quick Login (for demo/testing) */}
                        {users.filter(u => u.status === 'active' && u.roles.length > 0).length > 0 && (
                            <div className="mb-6 border-t pt-4">
                                <h3 className="text-sm font-semibold mb-3 text-slate-600">Quick Login (Demo Mode):</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {users.filter(u => u.status === 'active' && u.roles.length > 0).slice(0, 3).map(user => (
                                        <button 
                                            key={user.id} 
                                            onClick={() => handleQuickLogin(user)} 
                                            className="text-left p-2 bg-slate-50 hover:bg-red-50 rounded text-sm flex items-center gap-2 transition-colors"
                                        >
                                           <UserCheck size={16} className="text-slate-500" />
                                           <div>
                                               <p className="font-medium text-sm">{user.name}</p>
                                               <p className="text-xs text-slate-500">{user.email}</p>
                                           </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Registration Option */}
                        <div className="border-t pt-4">
                            <p className="text-center text-slate-600 mb-3">New to the league?</p>
                            <button 
                                onClick={() => setAuthMode('register')}
                                className="w-full bg-green-600 text-white p-3 rounded-md hover:bg-green-700 transition-colors font-semibold"
                            >
                                Request Access
                            </button>
                        </div>
                        
                        <button 
                            onClick={handleAuthModalClose} 
                            className="w-full mt-4 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors"
                        >
                            Continue as Guest
                        </button>
                    </div>
                ) : (
                    // Registration View
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Request Access</h2>
                            <button 
                                onClick={() => setAuthMode('login')}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-6 w-6"/>
                            </button>
                        </div>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleRegistration(); }} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                                <input
                                    type="text"
                                    value={registrationData.name}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Email */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={registrationData.email}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                            
                            {/* Phone */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={registrationData.phone}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            
                            {/* Preferred Role */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Preferred Role *</label>
                                <select
                                    value={registrationData.preferredRole}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, preferredRole: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    <option value="player">Player</option>
                                    <option value="coach">Coach</option>
                                </select>
                            </div>
                            
                            {/* Interested Team */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Interested Team</label>
                                <select
                                    value={registrationData.teamId}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, teamId: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">No preference</option>
                                    {teams.filter(t => t.active).sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                        <option key={team.id} value={team.id}>{team.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* Reason for Joining */}
                            <div>
                                <label className="block font-semibold text-slate-700 mb-1">Why do you want to join? *</label>
                                <textarea
                                    value={registrationData.reasonForJoining}
                                    onChange={(e) => setRegistrationData(prev => ({ ...prev, reasonForJoining: e.target.value }))}
                                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                                    placeholder="Tell us about your experience and why you want to join our league..."
                                    required
                                />
                            </div>
                            
                            {/* Submit Buttons */}
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setAuthMode('login')}
                                    className="flex-1 bg-slate-200 text-slate-700 p-2 rounded hover:bg-slate-300 transition-colors"
                                >
                                    Back to Login
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors font-semibold"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    ), [authMode, registrationData, users, teams, handleAuthModalClose]);
    
    const NavItem = ({ icon, label, pageName }) => (
        <button onClick={() => navigate(pageName)}
            className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${
                (page === pageName && !selectedTeam)
                    ? 'text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
            style={{backgroundColor: (page === pageName && !selectedTeam) ? websiteStyle.accentColor : 'transparent'}}
        >
            {icon}<span>{label}</span>
        </button>
    );
    
    const renderPage = () => {
        let pageComponent;

        if (page === 'team' && selectedTeam) {
            pageComponent = <TeamDetailPage teamId={selectedTeam} teams={teams} players={players} leagueSchedule={leagueSchedule} currentUser={currentUser} setPlayers={setPlayers} setTeams={setTeams} websiteStyle={websiteStyle} playMusic={playMusic} stopAllMusic={stopAllMusic} musicState={musicState} getTeamNewsItems={getTeamNewsItems} setTeamNewsItems={setTeamNewsItems} addTeamNewsItem={addTeamNewsItem} updateTeamNewsItem={updateTeamNewsItem} deleteTeamNewsItem={deleteTeamNewsItem} setSelectedNewsItem={setSelectedNewsItem} friends={friends} sponsors={sponsors} />;
        } else {
            switch (page) {
                case 'home': pageComponent = <NewHomePage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} leagueInfo={leagueInfo} currentUser={currentUser} websiteStyle={websiteStyle} setCurrentUser={setCurrentUser} getAllNewsItems={getAllNewsItems} setSelectedNewsItem={setSelectedNewsItem} addTeamNewsItem={addTeamNewsItem} updateTeamNewsItem={updateTeamNewsItem} deleteTeamNewsItem={deleteTeamNewsItem} />; break;
                case 'events': pageComponent = <EventsPage teams={teams} leagueSchedule={leagueSchedule} onTeamClick={(teamId) => navigate('team', teamId)} currentUser={currentUser} websiteStyle={websiteStyle} onUpdateRSVP={handleUpdateRSVP} users={users} onSendNotification={sendEventNotification} />; break;
                case 'event-dashboard': pageComponent = <EventDashboard teams={teams} currentUser={currentUser} onSendNotification={sendEventNotification} websiteStyle={websiteStyle} />; break;
                case 'standings': pageComponent = <StandingsPage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} websiteStyle={websiteStyle} />; break;
                case 'league_contact': pageComponent = <LeagueContactPage websiteStyle={websiteStyle} leagueInfo={leagueInfo} />; break;
                case 'chat': 
                    pageComponent = currentUser ? <ChatPage currentUser={currentUser} /> : <div className="p-8 text-center"><h2 className="text-2xl font-bold">Access Denied</h2><p>You must be logged in to access the chat.</p></div>;
                    break;
                case 'admin':
                    pageComponent = currentUser 
                        ? <AdminPage teams={teams} setTeams={setTeams} players={players} setPlayers={setPlayers} leagueSchedule={leagueSchedule} gameTickerData={gameTickerData} setGameTickerData={setGameTickerData} currentUser={currentUser} users={users} setUsers={setUsers} websiteStyle={websiteStyle} setWebsiteStyle={setWebsiteStyle} leagueInfo={leagueInfo} setLeagueInfo={setLeagueInfo} seasons={seasons} setSeasons={setSeasons} currentSeason={currentSeason} setCurrentSeason={setCurrentSeason} setLeagueSchedule={setLeagueSchedule} friends={friends} setFriends={setFriends} sponsors={sponsors} setSponsors={setSponsors} /> 
                        : <div className="p-8 text-center"><h2 className="text-2xl font-bold">Access Denied</h2><p>You must be logged in to view this page.</p></div>;
                    break;
                default: pageComponent = <NewHomePage teams={teams} onTeamClick={(teamId) => navigate('team', teamId)} leagueInfo={leagueInfo} currentUser={currentUser} websiteStyle={websiteStyle} setCurrentUser={setCurrentUser} getAllNewsItems={getAllNewsItems} setSelectedNewsItem={setSelectedNewsItem} addTeamNewsItem={addTeamNewsItem} updateTeamNewsItem={updateTeamNewsItem} deleteTeamNewsItem={deleteTeamNewsItem} />;
            }
        }
        return <div className="w-full">{pageComponent}</div>;
    };

    const backgroundStyle = {
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'%3E%3Cg fill='%23d1d5db' fill-opacity='0.1'%3E%3Cpath d='M12.5 0 L50 37.5 L87.5 0 L100 12.5 L62.5 50 L100 87.5 L87.5 100 L50 62.5 L12.5 100 L0 87.5 L37.5 50 L0 12.5 Z'/%3E%3C/g%3E%3C/svg%3E")`,
    };
    

    return (
        <div className="min-h-screen bg-slate-100">


            {/* Loading Screen */}
            {dataLoading && (
                <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto mb-4"></div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Loading MLBL</h2>
                        <p className="text-slate-600">Syncing league data across all devices...</p>
                    </div>
                </div>
            )}

            {showLogin && <AuthModal />}
            
            {/* Fixed Sidebar */}
            <aside 
                className={`bg-slate-900 text-white w-64 space-y-6 py-7 px-2 fixed inset-y-0 left-0 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-30 flex flex-col overflow-y-auto`} 
                style={{
                    backgroundColor: websiteStyle.primaryColor,
                    backgroundImage: websiteStyle.sidebarImage ? `linear-gradient(rgba(0,0,0,${1 - websiteStyle.sidebarOpacity}), rgba(0,0,0,${1 - websiteStyle.sidebarOpacity})), url(${websiteStyle.sidebarImage})` : 'none',
                    backgroundSize: websiteStyle.sidebarMode === 'contain' ? 'contain' : websiteStyle.sidebarMode === 'repeat' ? 'auto' : 'cover',
                    backgroundRepeat: websiteStyle.sidebarMode === 'repeat' ? 'repeat' : 'no-repeat',
                    backgroundPosition: 'center'
                }}
            >
                <div className="p-4 border-b border-slate-700 flex items-center justify-center">
                    <img src={websiteStyle.sidebarLogo || websiteStyle.logoUrl || 'https://placehold.co/200x200/4A5568/FFFFFF?text=LOGO'} alt="Logo" className="h-32 max-w-full object-contain" />
                </div>
                <nav className="flex-grow">
                    <NavItem icon={<Home size={20} />} label="Home" pageName="home" />
                    <NavItem icon={<Calendar size={20} />} label="Events & Schedule" pageName="events" />
                    <NavItem icon={<Swords size={20} />} label="Standings" pageName="standings" />
                    <NavItem icon={<Mail size={20} />} label="League Contact" pageName="league_contact" />
                    {currentUser && <NavItem icon={<MessageSquare size={20} />} label="Chat" pageName="chat" />}
                    <div className="pt-4 mt-4 border-t border-slate-700">
                      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-2">Teams</h2>
                      
                      {/* Field Lacrosse Teams */}
                      <div className="mb-3">
                        <button 
                            onClick={() => setSidebarSections(prev => ({...prev, fieldLacrosse: !prev.fieldLacrosse}))}
                            className="w-full text-left px-2 py-1 hover:bg-slate-700 hover:bg-opacity-50 rounded transition-colors"
                        >
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Trophy size={12} className="mr-1" /> Field Lacrosse
                                </div>
                                <div className={`transform transition-transform ${sidebarSections.fieldLacrosse ? 'rotate-180' : ''}`}>
                                    <ArrowDown size={12} />
                                </div>
                            </h3>
                        </button>
                        {sidebarSections.fieldLacrosse && (
                            <div className="space-y-1 mt-2">
                                {teams.filter(t => t.active && t.division === 'Field').sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                   <button
                                        key={team.id}
                                        onClick={() => navigate('team', team.id)}
                                        className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ml-2 ${
                                            page === 'team' && selectedTeam === team.id
                                                ? 'text-white'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                        style={{backgroundColor: (page === 'team' && selectedTeam === team.id) ? websiteStyle.accentColor : 'transparent'}}
                                    >
                                        <img src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} alt={team.name} className="w-6 h-6 rounded-full bg-white p-0.5 object-contain" />
                                        <span className="text-sm">{team.name}</span>
                                   </button>
                                ))}
                            </div>
                        )}
                      </div>
                      
                      {/* Box Lacrosse Teams */}
                      <div>
                        <button 
                            onClick={() => setSidebarSections(prev => ({...prev, boxLacrosse: !prev.boxLacrosse}))}
                            className="w-full text-left px-2 py-1 hover:bg-slate-700 hover:bg-opacity-50 rounded transition-colors"
                        >
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                                <div className="flex items-center">
                                    <Shield size={12} className="mr-1" /> Box Lacrosse
                                </div>
                                <div className={`transform transition-transform ${sidebarSections.boxLacrosse ? 'rotate-180' : ''}`}>
                                    <ArrowDown size={12} />
                                </div>
                            </h3>
                        </button>
                        {sidebarSections.boxLacrosse && (
                            <div className="space-y-1 mt-2">
                                {teams.filter(t => t.active && t.division === 'Box').sort((a, b) => a.name.localeCompare(b.name)).map(team => (
                                   <button
                                        key={team.id}
                                        onClick={() => navigate('team', team.id)}
                                        className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ml-2 ${
                                            page === 'team' && selectedTeam === team.id
                                                ? 'text-white'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }`}
                                        style={{backgroundColor: (page === 'team' && selectedTeam === team.id) ? websiteStyle.accentColor : 'transparent'}}
                                    >
                                        <img src={team.style?.logoUrl || 'https://placehold.co/200x200/cccccc/666666?text=Team'} alt={team.name} className="w-6 h-6 rounded-full bg-white p-0.5 object-contain" />
                                        <span className="text-sm">{team.name}</span>
                                   </button>
                                ))}
                            </div>
                        )}
                      </div>
                    </div>
                </nav>
                <div className="p-2 border-t border-slate-700">
                   {currentUser && 
                    <button onClick={handleAdminNav} className={`flex items-center space-x-3 p-2 rounded-md w-full text-left transition-colors ${page === 'admin' ? 'text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`} style={{backgroundColor: page === 'admin' ? websiteStyle.accentColor : 'transparent'}}>
                        <Crown size={20} /><span>Admin Portal</span>
                    </button>
                   }
                   {currentUser ? (
                       <button onClick={handleLogout} className="flex items-center space-x-3 p-2 rounded-md w-full text-left text-slate-300 hover:text-white" style={{'--hover-bg': websiteStyle.accentColor}}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                           <LogOut size={20} /><span>Log Out ({currentUser.name})</span>
                       </button>
                   ) : (
                       <button onClick={() => setShowLogin(true)} className="flex items-center space-x-3 p-2 rounded-md w-full text-left text-slate-300 hover:bg-slate-700 hover:text-white mt-2">
                           <LogIn size={20} /><span>Player & Staff Login</span>
                       </button>
                   )}
                </div>
            </aside>
            
            {/* Main Content Area */}
            <div className="w-full">
                <div className={`transition-all duration-300 ease-in-out ${isMenuOpen ? 'pl-64' : 'pl-0'} min-h-screen flex flex-col`}>
                <header className="sticky top-0 z-20">
                    <div 
                        className="text-white p-4 flex justify-between items-center shadow-md relative overflow-hidden"
                        style={{
                            backgroundColor: websiteStyle.bannerColor || websiteStyle.primaryColor,
                            backgroundImage: websiteStyle.bannerImage ? `linear-gradient(rgba(0,0,0,${1 - (websiteStyle.bannerOpacity !== undefined ? websiteStyle.bannerOpacity : 0.3)}), rgba(0,0,0,${1 - (websiteStyle.bannerOpacity !== undefined ? websiteStyle.bannerOpacity : 0.3)})), url(${websiteStyle.bannerImage})` : 'none',
                            backgroundSize: websiteStyle.bannerMode === 'contain' ? 'contain' : websiteStyle.bannerMode === 'repeat' ? 'auto' : 'cover',
                            backgroundRepeat: websiteStyle.bannerMode === 'repeat' ? 'repeat' : 'no-repeat',
                            backgroundPosition: 'center'
                        }}
                    >
                         <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md hover:bg-black hover:bg-opacity-20 text-white transition-colors">
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                        
                        {/* Header Content - Logo and/or Text */}
                        <div className={`flex items-center space-x-3 ${
                            websiteStyle.bannerLogoPosition === 'center' ? 'justify-center flex-1' :
                            websiteStyle.bannerLogoPosition === 'right' ? 'justify-end flex-1' :
                            'justify-start flex-1'
                        }`}>
                            {websiteStyle.bannerLogo && (
                                <img 
                                    src={websiteStyle.bannerLogo}
                                    alt="Banner Logo"
                                    className={`${
                                        websiteStyle.bannerLogoSize === 'small' ? 'h-8' :
                                        websiteStyle.bannerLogoSize === 'large' ? 'h-12' :
                                        'h-10'
                                    } w-auto object-contain drop-shadow-lg`}
                                />
                            )}
                            <h1 
                                className="text-xl font-bold tracking-wide drop-shadow-lg"
                                style={{
                                    fontSize: `${websiteStyle.bannerFontSize || 24}px`,
                                    fontFamily: websiteStyle.bannerFontFamily || 'Inter, sans-serif',
                                    color: websiteStyle.bannerTextColor || '#ffffff',
                                    fontWeight: websiteStyle.bannerTextBold ? 'bold' : 'normal',
                                    textShadow: websiteStyle.bannerTextShadow ? '2px 2px 4px rgba(0,0,0,0.7)' : 'none'
                                }}
                            >
                                {websiteStyle.bannerText || "MLBL"}
                            </h1>
                        </div>
                        
                        <div className="w-10"></div>
                    </div>
                    <GameTicker teams={teams} gameTickerData={gameTickerData} websiteStyle={websiteStyle} onTeamClick={(teamId) => navigate('team', teamId)} onNavigate={navigate} />
                </header>
                <main className="flex-1 overflow-y-auto relative" style={backgroundStyle}>
                    {renderPage()}
                    
                    {/* Logo Overlay */}
                    {websiteStyle.overlayLogo && (
                        <div 
                            className={`fixed bottom-8 z-10 pointer-events-none ${
                                websiteStyle.overlayLogoAlignment === 'left' ? 'left-8' :
                                websiteStyle.overlayLogoAlignment === 'right' ? 'right-8' :
                                'left-1/2 transform -translate-x-1/2'
                            }`}
                        >
                            <img 
                                src={websiteStyle.overlayLogo}
                                alt="Logo Overlay"
                                className={`opacity-20 ${
                                    websiteStyle.overlayLogoSize === 'small' ? 'h-16' :
                                    websiteStyle.overlayLogoSize === 'large' ? 'h-32' :
                                    'h-24'
                                } w-auto object-contain drop-shadow-lg`}
                            />
                        </div>
                    )}
                </main>
                </div>
            </div>
            
            <div>
                {/* Global Music Player */}
                <MusicPlayer musicState={musicState} setMusicState={setMusicState} />
            </div>
            
            {/* News Item Popup Modal */}
            {selectedNewsItem && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelectedNewsItem(null)}
                >
                    <div 
                        className="bg-white rounded-lg max-w-3xl w-full max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {selectedNewsItem.heading || selectedNewsItem.text}
                                </h2>
                                <button 
                                    onClick={() => setSelectedNewsItem(null)}
                                    className="text-slate-400 hover:text-slate-600 p-2"
                                >
                                    <X className="h-6 w-6"/>
                                </button>
                            </div>
                            
                            {/* Full size image */}
                            {selectedNewsItem.type === 'image' && selectedNewsItem.imageUrl && (
                                <div className="mb-4">
                                    <img 
                                        src={selectedNewsItem.imageUrl} 
                                        alt="News"
                                        className="w-full rounded-lg object-cover max-h-[400px]"
                                    />
                                </div>
                            )}
                            
                            {/* Inline video player */}
                            {selectedNewsItem.type === 'video' && selectedNewsItem.videoUrl && (
                                <div className="mb-4">
                                    <div className="bg-slate-100 rounded-lg p-4 text-center">
                                        {selectedNewsItem.videoUrl.includes('youtube.com') || selectedNewsItem.videoUrl.includes('youtu.be') ? (
                                            // YouTube embed
                                            <div className="aspect-video">
                                                <iframe
                                                    className="w-full h-full rounded-lg"
                                                    src={`https://www.youtube.com/embed/${selectedNewsItem.videoUrl.split('v=')[1]?.split('&')[0] || selectedNewsItem.videoUrl.split('/').pop()}`}
                                                    title="YouTube video"
                                                    frameBorder="0"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        ) : (
                                            // Generic video player
                                            <div className="aspect-video">
                                                <video 
                                                    className="w-full h-full rounded-lg"
                                                    controls
                                                    src={selectedNewsItem.videoUrl}
                                                >
                                                    Your browser does not support the video tag.
                                                </video>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {/* News content */}
                            <div className="space-y-3">
                                <div className="text-lg text-slate-700">
                                    {selectedNewsItem.text}
                                </div>
                                
                                {selectedNewsItem.comments && (
                                    <div className="bg-slate-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-slate-800 mb-2">Details</h3>
                                        <p className="text-slate-700">{selectedNewsItem.comments}</p>
                                    </div>
                                )}
                                
                                <div className="text-sm text-slate-500">
                                    Published: {new Date(selectedNewsItem.date).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Popup Modal */}
            {selectedImagePopup && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="relative max-w-4xl max-h-full">
                        <button
                            onClick={() => setSelectedImagePopup(null)}
                            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 bg-black bg-opacity-50 rounded-full p-2"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={selectedImagePopup.url}
                            alt={selectedImagePopup.caption || selectedImagePopup.galleryName}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            onClick={() => setSelectedImagePopup(null)}
                        />
                        {selectedImagePopup.caption && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-4 rounded-b-lg">
                                <p className="text-sm">{selectedImagePopup.caption}</p>
                                <p className="text-xs text-gray-300 mt-1">{selectedImagePopup.galleryName}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Banner Upload Component
const BannerUploadManager = ({ onBannerSelect, currentBanners = [] }) => {
    const [selectedBannerType, setSelectedBannerType] = useState('horizontal');
    const [showUploader, setShowUploader] = useState(false);
    
    const bannerPresets = {
        horizontal: {
            label: 'Horizontal Banners',
            icon: '📐',
            options: [
                { key: 'header', label: 'Header Banner', ratio: '5:1', width: 1200, height: 240 },
                { key: 'hero', label: 'Hero Banner', ratio: '3:1', width: 1200, height: 400 },
                { key: 'section', label: 'Section Banner', ratio: '16:9', width: 1200, height: 675 },
                { key: 'footer', label: 'Footer Banner', ratio: '4:1', width: 1200, height: 300 }
            ]
        },
        vertical: {
            label: 'Vertical Banners',
            icon: '📱',
            options: [
                { key: 'sidebar', label: 'Sidebar Banner', ratio: '1:3', width: 300, height: 900 },
                { key: 'mobile', label: 'Mobile Banner', ratio: '9:16', width: 360, height: 640 },
                { key: 'story', label: 'Story Banner', ratio: '9:16', width: 1080, height: 1920 },
                { key: 'poster', label: 'Poster Banner', ratio: '2:3', width: 800, height: 1200 }
            ]
        },
        square: {
            label: 'Square Banners',
            icon: '⬜',
            options: [
                { key: 'profile', label: 'Profile Banner', ratio: '1:1', width: 500, height: 500 },
                { key: 'social', label: 'Social Media', ratio: '1:1', width: 1080, height: 1080 },
                { key: 'logo', label: 'Logo Banner', ratio: '1:1', width: 300, height: 300 }
            ]
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Banner Type Selector */}
            <div className="flex justify-center space-x-4">
                {Object.entries(bannerPresets).map(([type, config]) => (
                    <button
                        key={type}
                        onClick={() => setSelectedBannerType(type)}
                        className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            selectedBannerType === type
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-300 hover:border-slate-400'
                        }`}
                    >
                        <div className="text-center">
                            <div className="text-2xl mb-1">{config.icon}</div>
                            <div className="text-sm font-medium">{config.label}</div>
                        </div>
                    </button>
                ))}
            </div>
            
            {/* Banner Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bannerPresets[selectedBannerType].options.map((option) => (
                    <div key={option.key} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-slate-800">{option.label}</h3>
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{option.ratio}</span>
                        </div>
                        
                        {/* Preview Box */}
                        <div className="mb-3 bg-slate-100 rounded border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-500 text-sm"
                             style={{ 
                                 aspectRatio: option.ratio,
                                 minHeight: selectedBannerType === 'vertical' ? '120px' : '60px'
                             }}>
                            {option.width} × {option.height}px
                        </div>
                        
                        <button
                            onClick={() => {
                                setShowUploader(true);
                                onBannerSelect?.({
                                    type: selectedBannerType,
                                    preset: option,
                                    aspectRatio: option.ratio.replace(':', '/') // Convert to CSS format
                                });
                            }}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors text-sm"
                        >
                            Upload {option.label}
                        </button>
                    </div>
                ))}
            </div>
            
            {/* Current Banners */}
            {currentBanners.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">Current Banners</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {currentBanners.map((banner, index) => (
                            <div key={index} className="border rounded-lg p-3">
                                <img 
                                    src={banner.url} 
                                    alt={banner.label}
                                    className="w-full rounded mb-2"
                                    style={{ aspectRatio: banner.aspectRatio }}
                                />
                                <div className="text-sm font-medium text-slate-700">{banner.label}</div>
                                <div className="text-xs text-slate-500">{banner.dimensions}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
