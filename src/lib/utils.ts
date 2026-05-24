import heroImages from './hero_images.json';

export function getHeroImage(heroName: string) {
  if (!heroName) return '';
  // Use the official mobile legends web CDN
  const slug = heroName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `https://akmweb.youngjoygame.com/web/svnres/img/mlbb/homepage/hp_hero/hero_${slug}.png`;
}

export function getPlayerImage(username: string, playersList: any[] = []) {
  if (!username) return '';
  const player = playersList.find(p => p.username.toLowerCase() === username.toLowerCase());
  if (player && player.pictureUrl) {
    return player.pictureUrl;
  }
  // Fallback to UI Avatars if no picture is set
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=00C853&color=000&bold=true`;
}
