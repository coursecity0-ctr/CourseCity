// About Page Script
// Inherits from main script.js

document.addEventListener('DOMContentLoaded', () => {
  // Animate stats on scroll
  const statNumbers = document.querySelectorAll('.stat-number');
  
  const animateStats = () => {
    statNumbers.forEach(stat => {
      const rect = stat.getBoundingClientRect();
      if (rect.top < window.innerHeight && !stat.classList.contains('animated')) {
        const finalValue = stat.textContent;
        const numValue = parseInt(finalValue.replace(/\D/g, ''));
        const suffix = finalValue.replace(/[\d,]/g, '');
        
        let current = 0;
        const increment = numValue / 50;
        const duration = 1500;
        const stepTime = duration / 50;
        
        stat.classList.add('animated');
        
        const timer = setInterval(() => {
          current += increment;
          if (current >= numValue) {
            stat.textContent = finalValue;
            clearInterval(timer);
          } else {
            stat.textContent = Math.floor(current).toLocaleString() + suffix;
          }
        }, stepTime);
      }
    });
  };
  
  // Check on scroll
  if (statNumbers.length > 0) {
    window.addEventListener('scroll', animateStats);
    animateStats(); // Check initially
  }
  
  console.log('%cAbout Page Loaded', 'color: #ff7a00; font-weight: bold;');
});
