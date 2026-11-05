/**
 * Règles sur les photos des véhicules (fichier « pur » : aucun accès réseau ni base, testé).
 *
 * Ces règles sont appliquées à TROIS endroits, par sécurité :
 *  1. dans le navigateur (pour répondre vite à l'utilisateur) ;
 *  2. dans le serveur, avant de délivrer l'autorisation d'envoi ;
 *  3. par Supabase Storage lui-même (limites de taille et de type du « bucket », migration 0003).
 * Seules les deux dernières comptent pour la sécurité : le navigateur peut être contourné.
 */

/** Nom du bucket (espace de stockage) public des photos. */
export const BUCKET_PHOTOS = "vehicules-photos";

/** Taille maximale d'une photo (alignée sur la limite du bucket : 5 Mo). */
export const TAILLE_MAX_PHOTO_OCTETS = 5 * 1024 * 1024;

/** Nombre maximal de photos par véhicule. */
export const NOMBRE_MAX_PHOTOS = 20;

/** Types de fichiers acceptés et extension de stockage associée. */
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const TYPES_PHOTO_ACCEPTES = Object.keys(EXTENSIONS);

/** Extension de stockage pour un type de fichier, ou `undefined` si le type n'est pas accepté. */
export function extensionPourType(type: string): string | undefined {
  return EXTENSIONS[type];
}

/**
 * Contrôle un fichier AVANT envoi à partir de ce que le navigateur annonce (type et taille).
 * Renvoie un message d'erreur en français, ou `null` si le fichier est acceptable.
 */
export function erreurFichierPhoto(fichier: {
  type: string;
  taille: number;
}): string | null {
  if (!extensionPourType(fichier.type)) {
    return "Format non accepté : utilisez une image JPEG, PNG ou WebP.";
  }
  if (!Number.isFinite(fichier.taille) || fichier.taille <= 0) {
    return "Le fichier est vide.";
  }
  if (fichier.taille > TAILLE_MAX_PHOTO_OCTETS) {
    return `Photo trop lourde (${(fichier.taille / 1024 / 1024).toFixed(1)} Mo) : 5 Mo maximum.`;
  }
  return null;
}

const MOTIF_UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * Construit le chemin de stockage d'une nouvelle photo : « vehicules/<id du véhicule>/<id aléatoire>.<ext> ».
 * Le nom est ALÉATOIRE : on n'utilise jamais le nom du fichier envoyé (risque de collision, de
 * caractères dangereux ou de fuite d'information).
 */
export function construireCleStockage(
  vehiculeId: string,
  extension: string,
  identifiantAleatoire: string,
): string {
  return `vehicules/${vehiculeId}/${identifiantAleatoire}.${extension}`;
}

/**
 * Vrai si `cle` est EXACTEMENT un chemin de photo valide de CE véhicule.
 * Contrôle essentiel avant d'enregistrer une photo : le navigateur indique la clé du fichier qu'il
 * a envoyé, et on ne doit jamais accepter un chemin arbitraire (fichier d'un autre véhicule,
 * remontée de dossier « ../ »…).
 */
export function cleAppartientAuVehicule(cle: string, vehiculeId: string): boolean {
  if (!new RegExp(`^${MOTIF_UUID}$`, "i").test(vehiculeId)) return false;
  const motif = new RegExp(
    `^vehicules/${vehiculeId.toLowerCase()}/${MOTIF_UUID}\\.(jpg|png|webp)$`,
  );
  return motif.test(cle);
}
