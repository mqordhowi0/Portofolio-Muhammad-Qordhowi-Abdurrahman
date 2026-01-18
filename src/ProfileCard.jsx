import { useRef } from "react";
import "./ProfileCard.css";

// Pastikan path foto benar
const fotoUrl = "/assets/icon.jpg"; 

const ProfileCard = () => {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    
    // Hitung posisi mouse relatif terhadap kartu (0 sampai 1)
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Hitung rotasi (Maksimal 15 derajat)
    // Jika mouse di kiri, rotateY negatif. Jika di kanan, rotateY positif.
    // Jika mouse di atas, rotateX positif. Jika di bawah, rotateX negatif.
    const rotateX = ((centerY - y) / centerY) * 15; 
    const rotateY = ((x - centerX) / centerX) * 15;

    // Update CSS Variables secara real-time
    card.style.setProperty("--pointer-x", `${x}px`);
    card.style.setProperty("--pointer-y", `${y}px`);
    card.style.setProperty("--rotate-x", `${rotateX}deg`);
    card.style.setProperty("--rotate-y", `${rotateY}deg`);
    card.style.setProperty("--card-opacity", "1");
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    // Reset posisi ke tengah saat mouse keluar
    const card = cardRef.current;
    card.style.setProperty("--rotate-x", `0deg`);
    card.style.setProperty("--rotate-y", `0deg`);
    card.style.setProperty("--card-opacity", "0");
  };

  return (
    <div className="flex justify-center items-center py-10">
      <div 
        ref={cardRef}
        className="pc-card-wrapper animate__animated animate__fadeInUp"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <section className="pc-card">
          <div className="pc-inside">
            
            {/* Layer Efek */}
            <div className="pc-shine"></div>
            <div className="pc-glare"></div>
            
            {/* Konten Atas (Avatar + Info) */}
            <div className="pc-content pc-avatar-content">
              <img 
                className="avatar" 
                alt="Profile Avatar" 
                src={fotoUrl} 
              />
              
              <div className="pc-user-info">
                <div className="pc-user-details">
                  <div className="pc-mini-avatar">
                    <img alt="Mini Avatar" src={fotoUrl} />
                  </div>
                  <div className="pc-user-text text-left">
                    <div className="pc-handle">You can call me Abdur</div>
                    <div className="pc-status">Available to Hire</div>
                  </div>
                </div>
                
                <a href="#contact">
                  <button className="pc-contact-btn" type="button">
                    Contact Me
                  </button>
                </a>
              </div>
            </div>

            {/* Konten Bawah (Nama) */}
            <div className="pc-content">
              <div className="pc-details text-left">
                <h3>Abdur</h3>
                <p>Fullstack Developer</p>
                <p className="text-xs text-gray-400 mt-1">Surabaya, Indonesia</p>
              </div>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfileCard;