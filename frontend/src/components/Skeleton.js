import React from 'react';

/**
 * Skeleton loading components for better perceived performance
 */

// Base skeleton pulse animation
const Skeleton = ({ className = '', style = {} }) => (
  <div 
    className={`animate-pulse bg-slate-200 rounded ${className}`}
    style={style}
  />
);

// Text line skeleton
export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton 
        key={i} 
        className="h-4" 
        style={{ width: i === lines - 1 ? '75%' : '100%' }}
      />
    ))}
  </div>
);

// Card skeleton
export const SkeletonCard = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
    <Skeleton className="h-32 w-full mb-4" />
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

// Team card skeleton
export const SkeletonTeamCard = () => (
  <div className="bg-white rounded-lg border shadow-sm p-4 flex items-center gap-4">
    <Skeleton className="w-16 h-16 rounded-full flex-shrink-0" />
    <div className="flex-1">
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-4 w-24" />
    </div>
  </div>
);

// Event card skeleton
export const SkeletonEventCard = () => (
  <div className="bg-white rounded-lg border shadow-sm p-4">
    <div className="flex justify-between items-start mb-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
    <Skeleton className="h-4 w-32 mb-2" />
    <Skeleton className="h-4 w-48" />
  </div>
);

// Table row skeleton
export const SkeletonTableRow = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

// Full page loading skeleton
export const PageSkeleton = () => (
  <div className="p-6 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
    
    {/* Stats cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-lg border p-4">
          <Skeleton className="h-8 w-16 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
    
    {/* Content cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// Homepage skeleton
export const HomePageSkeleton = () => (
  <div className="space-y-8">
    {/* Hero/Banner area */}
    <Skeleton className="h-48 md:h-64 w-full rounded-lg" />
    
    {/* Quick stats */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="bg-white rounded-lg border p-4 text-center">
          <Skeleton className="h-10 w-10 rounded-full mx-auto mb-2" />
          <Skeleton className="h-6 w-16 mx-auto mb-1" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
      ))}
    </div>
    
    {/* Sections */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Events section */}
      <div className="bg-white rounded-lg border p-4">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <SkeletonEventCard key={i} />
          ))}
        </div>
      </div>
      
      {/* Teams section */}
      <div className="bg-white rounded-lg border p-4">
        <Skeleton className="h-6 w-24 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <SkeletonTeamCard key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Sidebar skeleton
export const SidebarSkeleton = () => (
  <div className="p-4 space-y-4">
    {/* Logo area */}
    <div className="flex items-center gap-3 mb-6">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div>
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    
    {/* Nav items */}
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-10 w-full rounded-lg" />
      ))}
    </div>
    
    {/* Teams section */}
    <div className="mt-6">
      <Skeleton className="h-4 w-16 mb-3" />
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
