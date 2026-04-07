"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
    name: string;
}

export function StarRating({ name }: StarRatingProps) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-2">
            <input type="hidden" name={name} value={rating} required min="1" max="5" />
            {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= (hover || rating);

                return (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        className={`transform transition-all duration-200 hover:scale-110 focus:outline-none active:scale-95 ${
                            active ? "text-yellow-400 drop-shadow-md" : "text-gray-300"
                        }`}
                        aria-label={`${star} estrellas`}
                    >
                        <Star className={`h-9 w-9 ${active ? "fill-current" : ""}`} />
                    </button>
                );
            })}
        </div>
    );
}
