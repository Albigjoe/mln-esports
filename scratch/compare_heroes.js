const original = ["Aamon","Akai","Aldous","Alice","Alpha","Alucard","Angela","Argus","Arlott","Atlas","Aulus","Aurora","Badang","Balmond","Bane","Barats","Baxia","Beatrix","Belerick","Benedetta","Brody","Bruno","Carmilla","Cecilion","Chang'e","Chip","Chou","Cici","Claude","Clint","Cyclops","Diggie","Dyrroth","Edith","Esmeralda","Estes","Eudora","Fanny","Faramis","Floryn","Franco","Fredrinn","Freya","Gatotkaca","Gloo","Gord","Granger","Grock","Guinevere","Gusion","Hanabi","Hanzo","Harith","Harley","Hayabusa","Helcurt","Hilda","Hylos","Irithel","Ixia","Jawhead","Johnson","Joy","Julian","Kadita","Kagura","Kaja","Kalea","Karina","Karrie","Khaleed","Khufra","Kimmy","Lancelot","Lapu-Lapu","Layla","Leomord","Lesley","Ling","Lolita","Lukas","Lunox","Luo Yi","Lylia","Marcel","Martis","Masha","Mathilda","Melissa","Minotaur","Minsitthar","Miya","Moskov","Nana","Natalia","Natan","Nolan","Novaria","Obsidia","Odette","Paquito","Pharsa","Phoveus","Popol and Kupa","Rafaela","Roger","Ruby","Saber","Selena","Silvanna","Sora","Sun","Suyou","Terizla","Thamuz","Tigreal","Uranus","Vale","Valentina","Valir","Vexana","Wanwan","X.Borg","Xavier","Yi Sun-shin","Yin","Yu Zhong","Yve","Zetian","Zhask","Zhuxin","Zilong"];
const fs = require('fs');
const updated = JSON.parse(fs.readFileSync('scratch/final_heroes_list.json', 'utf8'));

console.log("Original list size:", original.length);
console.log("Updated list size:", updated.length);

const originalSet = new Set(original);
const updatedSet = new Set(updated);

const missingInOriginal = updated.filter(x => !originalSet.has(x));
console.log("Missing in original list (in Fandom but not Admin):", missingInOriginal);

const missingInUpdated = original.filter(x => !updatedSet.has(x));
console.log("Missing in updated list (in Admin but not Fandom):", missingInUpdated);
