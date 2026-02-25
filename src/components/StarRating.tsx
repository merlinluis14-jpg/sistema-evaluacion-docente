"use client";

import { useState } from "react";

interface StarRatingProps {
    name: string;
}

export function StarRating({ name }: StarRatingProps) {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);

    return (
        <div className="flex gap-2">
            {/* Campo oculto que enviará el Server Action el valor seleccionado */}
            <input type="hidden" name={name} value={rating} required min="1" max="5" />
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    className={`text-4xl transition-all duration-200 focus:outline-none transform hover:scale-110 active:scale-95 ${star <= (hover || rating) ? "text-yellow-400 drop-shadow-md" : "text-gray-300"
                        }`}
                    aria-label={`${star} estrellas`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}
