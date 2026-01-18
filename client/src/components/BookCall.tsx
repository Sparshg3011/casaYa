export default function BookCall() {
  return (
    <div className="bg-blue-600 rounded-[48px] px-4 py-12 md:px-6 md:py-24">
      <div className="max-w-7xl mx-auto text-center space-y-6 md:space-y-8">
        <span className="text-white/90 text-lg md:text-xl">Contact us</span>
        
        <h2 className="text-3xl md:text-5xl text-white font-normal">
          Is this the property <br/> 
          you have been looking for?
        </h2>
        
        <div>
          <button className="bg-white text-black px-6 py-2.5 md:px-8 md:py-3 rounded-full text-base md:text-lg hover:bg-gray-100 transition-colors">
            Book a call
          </button>
        </div>
      </div>
    </div>
  );
} 