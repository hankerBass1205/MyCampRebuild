'use client';

const APPLICATION_STATUS = {
  0: {
    text: '審核中',
    className: 'bg-[#FFE4C8] text-[#95603B]'
  },
  1: {
    text: '已通過',
    className: 'bg-[#DCEDC2] text-[#4F6F3A]'
  },
  2: {
    text: '已退回',
    className: 'bg-[#FFDADA] text-[#A15555]'
  }
};

export default function CampStatusBadge({ status, className = '' }) {
  const statusConfig = APPLICATION_STATUS[status] || APPLICATION_STATUS[0];

  return (
    <span 
      className={`
        px-3 py-1.5 rounded-full text-xs font-medium
        ${statusConfig.className}
        ${className}
      `}
    >
      {statusConfig.text}
    </span>
  );
} 