import React from "react";

export default function EventCard({ event = {} }) {
  // Graceful fallback to prevent crash
  const {
    title = "Untitled Event",
    description = "No description available",
    date = "TBA",
    image = "https://source.unsplash.com/600x400/?event,technology",
    _id,
  } = event || {};

  return (
    <div
      className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden hover:shadow-xl transition"
      style={{ width: "300px" }}
    >
      <img
        src={image}
        alt={title}
        className="w-full h-40 object-cover"
        onError={(e) => {
          e.target.src = "https://source.unsplash.com/600x400/?event,tech";
        }}
      />

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
          {description}
        </p>
        <p className="text-xs text-gray-400 mb-3">📅 {date}</p>
        <a
          href={`/event/${_id}`}
          className="inline-block bg-indigo-600 text-white px-3 py-1 rounded-md text-sm hover:bg-indigo-700 transition"
        >
          View
        </a>
      </div>
    </div>
  );
}
