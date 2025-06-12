"use client";
import React, { useState, useEffect } from "react";
import { FiStar } from "react-icons/fi";

const StarRating = ({
  maxRating = 5,
  initialRating = 0,
  onRatingChange,
  size = 32,
}) => {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    setRating(initialRating);
  }, [initialRating]);

  const handleStarClick = (newRating) => {
    setRating(newRating);
    onRatingChange?.(newRating);
  };

  const getStarColor = (index) => {
    const current = hoverRating || rating;
    return index <= current ? "#ffd700" : "#f5e6d3";
  };

  return (
    <div className="star-rating" onMouseLeave={() => setHoverRating(0)}>
      {Array.from({ length: maxRating }, (_, index) => {
        const starValue = index + 1;
        return (
          <button
            key={starValue}
            className="star-button"
            onClick={() => handleStarClick(starValue)}
            onMouseEnter={() => setHoverRating(starValue)}
            aria-label={`${starValue}星`}
            style={{ width: size, height: size }}
          >
            <FiStar
              size={size}
              color={getStarColor(starValue)}
              fill={getStarColor(starValue)} // 添加這行來設置實心顏色
              strokeWidth={1.5}
            />
            {starValue <= (hoverRating || rating) && (
              <div className="star-hover-effect" style={{ width: size }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default StarRating;
