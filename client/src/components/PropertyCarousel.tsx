'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const images = {
  livingRoom: [
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6",
    "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e"
  ],
  kitchen: [
    "https://images.unsplash.com/photo-1556911220-bff31c812dba",
    "https://images.unsplash.com/photo-1556912173-3bb406ef7e77",
    "https://images.unsplash.com/photo-1576698483491-8c43f0862543",
    "https://images.unsplash.com/photo-1564540583246-934409427776"
  ]
};

export default function PropertyCarousel() {
  const [currentIndexes, setCurrentIndexes] = useState({
    livingRoom: 0,
    kitchen: 0
  });

  const handleNext = (type: 'livingRoom' | 'kitchen') => {
    setCurrentIndexes(prev => ({
      ...prev,
      [type]: (prev[type] + 1) % images[type].length
    }));
  };

  const handlePrev = (type: 'livingRoom' | 'kitchen') => {
    setCurrentIndexes(prev => ({
      ...prev,
      [type]: (prev[type] - 1 + images[type].length) % images[type].length
    }));
  };

  const CarouselControls = ({ type }: { type: 'livingRoom' | 'kitchen' }) => (
    <>
      <button
        onClick={() => handlePrev(type)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10"
      >
        <ChevronLeftIcon className="h-6 w-6" />
      </button>
      <button
        onClick={() => handleNext(type)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white transition-colors z-10"
      >
        <ChevronRightIcon className="h-6 w-6" />
      </button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {images[type].map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full ${
              currentIndexes[type] === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
          <Image
            src={images.livingRoom[currentIndexes.livingRoom]}
            alt="Living Room"
            fill
            className="object-cover transition-all duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
          />
          <CarouselControls type="livingRoom" />
        </div>
        <div className="relative aspect-[4/3] rounded-3xl overflow-hidden">
          <Image
            src={images.kitchen[currentIndexes.kitchen]}
            alt="Kitchen"
            fill
            className="object-cover transition-all duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 640px"
          />
          <CarouselControls type="kitchen" />
        </div>
      </div>
    </div>
  );
} 