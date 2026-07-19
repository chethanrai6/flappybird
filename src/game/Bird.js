import { audio } from './Audio.js';

export class Bird {
  constructor(startX, startY) {
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.radius = 16;
    
    // Physics parameters
    this.velocity = 0;
    this.gravity = 0.45;
    this.jumpImpulse = -7.6;
    this.rotation = 0;
    
    // Wing animation
    this.wingAngle = 0;
    this.wingSpeed = 0.25;

    // State
    this.isDead = false;

    // Motion Trail Particles
    this.trailParticles = [];

    // Crash Feather Particles
    this.featherParticles = [];
  }

  reset() {
    this.x = this.startX;
    this.y = this.startY;
    this.velocity = 0;
    this.rotation = 0;
    this.isDead = false;
    this.trailParticles = [];
    this.featherParticles = [];
  }

  flap() {
    if (this.isDead) return;
    this.velocity = this.jumpImpulse;
    audio.playFlap();

    // Spawn flight trail particles
    for (let i = 0; i < 3; i++) {
      this.trailParticles.push({
        x: this.x - 12 + Math.random() * 4,
        y: this.y + Math.random() * 8 - 4,
        radius: Math.random() * 3.5 + 2,
        alpha: 0.8,
        vx: -Math.random() * 1.5 - 1,
        vy: Math.random() * 0.8 - 0.4
      });
    }
  }

  triggerCrash() {
    if (this.isDead) return;
    this.isDead = true;
    audio.playCrash();

    // Spawn crash feather particles
    for (let i = 0; i < 8; i++) {
      this.featherParticles.push({
        x: this.x + Math.random() * 20 - 10,
        y: this.y + Math.random() * 20 - 10,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        scale: Math.random() * 0.6 + 0.4,
        color: Math.random() > 0.5 ? '#2BB696' : '#7BC644'
      });
    }
  }

  update(groundY, isPlaying = true) {
    if (isPlaying) {
      if (!this.isDead) {
        // Physics update
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Rotation interpolation
        if (this.velocity < 0) {
          this.rotation = Math.max(-0.4, this.rotation - 0.08);
        } else {
          this.rotation = Math.min(1.2, this.rotation + 0.05);
        }

        // Wing flap speed based on velocity
        this.wingAngle += this.wingSpeed;

        // Ground constraint
        if (this.y + this.radius >= groundY) {
          this.y = groundY - this.radius;
          this.triggerCrash();
        }
      } else {
        // Crashed falling physics until ground hit
        if (this.y + this.radius < groundY) {
          this.velocity += this.gravity * 1.2;
          this.y += this.velocity;
          this.rotation = Math.min(Math.PI / 2, this.rotation + 0.1);
        } else {
          this.y = groundY - this.radius;
        }

        // Update feather explosion particles
        this.featherParticles.forEach(f => {
          f.x += f.vx;
          f.y += f.vy;
          f.vy += 0.15; // Gravity on feathers
          f.rotation += f.rotSpeed;
        });
      }

      // Update trail particles
      for (let i = this.trailParticles.length - 1; i >= 0; i--) {
        const p = this.trailParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.03;
        if (p.alpha <= 0) {
          this.trailParticles.splice(i, 1);
        }
      }
    } else {
      // Gentle idle hover animation before starting
      this.wingAngle += 0.15;
      this.y = this.startY + Math.sin(this.wingAngle * 0.8) * 5;
    }
  }

  draw(ctx) {
    // 1. Draw Trail Particles
    this.trailParticles.forEach(p => {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Draw Bird Entity
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const bodyColor = '#2BB696';
    const darkTeal = '#1E856D';
    const bellyColor = '#FFFFFF';
    const beakColor = '#F4A261';

    // Outer Teal Body
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();

    // Darker outline
    ctx.strokeStyle = darkTeal;
    ctx.lineWidth = 2;
    ctx.stroke();

    // White Belly Arc
    ctx.fillStyle = bellyColor;
    ctx.beginPath();
    ctx.arc(2, 4, 13, Math.PI * 0.1, Math.PI * 0.95);
    ctx.fill();

    // Eye (White circle + Pupil)
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(7, -5, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (!this.isDead) {
      // Normal Eye Pupil
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(8.5, -5, 3, 0, Math.PI * 2);
      ctx.fill();
      // White reflection dot
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(9.5, -6.5, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Crashed Eye (X Cross)
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(5, -8); ctx.lineTo(10, -3);
      ctx.moveTo(10, -8); ctx.lineTo(5, -3);
      ctx.stroke();
    }

    // Beak
    ctx.fillStyle = beakColor;
    ctx.beginPath();
    ctx.moveTo(14, -2);
    ctx.lineTo(24, 2);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Wing
    ctx.save();
    ctx.translate(-4, 2);
    const wingFlap = Math.sin(this.wingAngle) * 0.5;
    ctx.rotate(wingFlap);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 6, -Math.PI / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = darkTeal;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    ctx.restore();

    // 3. Draw Feather Explosion Particles on Crash
    this.featherParticles.forEach(f => {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);
      ctx.scale(f.scale, f.scale);
      ctx.fillStyle = f.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}
