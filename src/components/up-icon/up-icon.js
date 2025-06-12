"use client";

import "@/styles/pages/up-icon/style.css"

export default function UpIcon() {
  return (
    <>
      <div className="up-icon !z-[-1]">
        <a href="#" className="w-full h-full flex justify-center items-center no-underline">
          <i className="fa fa-arrow-up" aria-hidden="true" />
        </a>
      </div>
    </>
  );
}