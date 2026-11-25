# Nous deux

## 1. Firebase et notifications push
1. `index.html` et `firebase-messaging-sw.js` contiennent déjà la configuration du projet Firebase.
2. Firebase Console > ⚙️ Paramètres du projet > **Cloud Messaging** > **Configuration Web** > **Certificats Web Push** > génère une paire de clés. Copie la clé publique dans `VAPID_KEY` dans `index.html`. Si nécessaire, active aussi l’API **FCM Registration** dans Google Cloud Console.
3. Pour envoyer les notifications de façon sûre, les fonctions dans `functions/` envoient une notification générique au partenaire quand un message ou une réponse à un rendez-vous arrive. Le texte privé des messages n’est pas inclus dans la notification.
4. Les fonctions Firebase nécessitent le forfait **Blaze** (facturation activée; des frais peuvent s’appliquer). Après avoir vérifié les tarifs, installe Node.js 22 et Firebase CLI (`npm install -g firebase-tools`), puis lance depuis la racine :
   ```sh
   firebase login
   firebase deploy --only functions,firestore:rules
   ```
5. Authentication > Méthode de connexion > **Anonyme** doit être activé. Les règles Firestore sont dans `firestore.rules`.

## 2. Héberger gratuitement (GitHub Pages)
1. Publie tous les fichiers du dépôt sur GitHub (notamment `firebase-messaging-sw.js` et `manifest.webmanifest`), puis active **Settings > Pages > Branch `main` / root**.
2. Le lien est `https://TON-PSEUDO.github.io/nousdeux/` (1 à 2 min).
3. Si l'app affiche « auth/unauthorized-domain » : Firebase > Authentication > Paramètres > Domaines autorisés > ajoute `TON-PSEUDO.github.io`.

## 3. Installer sur les iPhone (toi et Ally)
Ouvrir le lien dans **Safari** > Partager > **Sur l'écran d'accueil**. Chacun choisit « Noah » ou « Ally », entre le prénom à afficher dans l'espace privé, puis crée l'espace ou rejoint avec le code de l'autre. Les notifications push sur iPhone nécessitent iOS 16.4 ou plus récent et l’app lancée depuis son icône sur l’écran d’accueil. Sur chaque iPhone, appuie sur **Activer les notifications** et accepte la demande iOS. Les notifications restent génériques et n’affichent pas le texte privé des messages.

## 4. Rappel de 16h
Raccourcis > Automatisation > + > **Heure du jour** 16:00, tous les jours > **Exécuter immédiatement** > action **Ouvrir les URL** avec le lien de l'app. (Alternative : un rappel quotidien à 16h dans l'app Rappels, avec le lien en URL.)

## 5. Widget d'écran verrouillé
Le widget d’écran verrouillé est fourni par **Scriptable** (un site web ne peut pas installer son propre widget iOS).
1. Installe Scriptable depuis l’App Store. Dans Scriptable, crée un script et colle le contenu de `scriptable-widget.js`; renseigne `API_KEY`, `CODE` et `ME` (« Noah » ou « Ally »).
2. Sur l’écran verrouillé, appui long > **Personnaliser** > **Écran verrouillé** > ajoute un widget **Scriptable** rectangulaire ou en ligne > touche-le et sélectionne ce script.
3. iOS le rafraîchit environ toutes les 15 à 30 minutes : ce n’est pas instantané.
