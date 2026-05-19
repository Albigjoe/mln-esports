export function getHeroImage(heroName: string) {
  if (!heroName) return '';
  // Format the name: lowercase, remove spaces, apostrophes, and hyphens to match typical asset naming
  const formattedName = heroName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Using a popular community MLBB raw github repository for hero icons
  // Alternatively, can point to local /heroes/${formattedName}.png if uploaded
  return `https://raw.githubusercontent.com/ridwaanhall/api-mobilelegends/main/images/heroes/${formattedName}.png`;
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
