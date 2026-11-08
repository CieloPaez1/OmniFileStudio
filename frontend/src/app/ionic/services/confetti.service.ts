import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {
  triggerLevelUpConfetti(): void {
    if (typeof document === 'undefined') return;

    const existing = document.getElementById('planix-confetti-container') || document.getElementById('taskgo-confetti-container');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'planix-confetti-container';
    container.style.position = 'fixed';
    container.style.inset = '0';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '999999';
    container.style.overflow = 'hidden';

    // Paleta de colores festivos acorde a Planix
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#ffd700'];
    const count = 55;

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.floor(Math.random() * 8) + 8; // 8px a 16px
      const left = Math.random() * 100; // 0% a 100%
      const duration = Math.random() * 2 + 1.8; // 1.8s a 3.8s
      const delay = Math.random() * 0.4; // 0s a 0.4s
      const isCircle = Math.random() > 0.5;

      piece.style.position = 'absolute';
      piece.style.top = '-20px';
      piece.style.left = `${left}%`;
      piece.style.width = `${size}px`;
      piece.style.height = isCircle ? `${size}px` : `${size * 0.6}px`;
      piece.style.backgroundColor = color;
      piece.style.borderRadius = isCircle ? '50%' : '3px';
      piece.style.opacity = '1';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      piece.style.animation = `planixConfettiFall ${duration}s ease-in ${delay}s forwards`;

      container.appendChild(piece);
    }

    // Inyectar animación CSS si aún no existe
    if (!document.getElementById('planix-confetti-style')) {
      const style = document.createElement('style');
      style.id = 'planix-confetti-style';
      style.innerHTML = `
        @keyframes planixConfettiFall {
          0% {
            transform: translateY(0) rotate(0deg) scale(0.8);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg) scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(container);

    setTimeout(() => {
      container.remove();
    }, 4000);
  }
}
