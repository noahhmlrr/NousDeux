# Nous deux

## 1. Firebase (5 min, une seule fois)
1. Console Firebase > projet nousdeux > ⚙️ Paramètres du projet > « Vos applications » > **Ajouter une application > Web (</>)**. Nom : nousdeux-web. Ignore l'hébergement.
2. Copie `apiKey`, `authDomain`, `projectId`, `appId` dans `index.html` (bloc `firebaseConfig`, à la place de COLLE_ICI).
3. Firestore Database > onglet **Règles** > colle `firestore.rules` > **Publier**.
4. Authentication > Méthode de connexion > Anonyme : déjà activé.

## 2. Héberger gratuitement (GitHub Pages)
1. github.com > New repository `nousdeux` (public) > Add file > Upload files : `index.html` + `icon-180.png`.
2. Settings > Pages > Branch `main` / root > Save. Le lien est `https://TON-PSEUDO.github.io/nousdeux/` (1 à 2 min).
3. Si l'app affiche « auth/unauthorized-domain » : Firebase > Authentication > Paramètres > Domaines autorisés > ajoute `TON-PSEUDO.github.io`.

## 3. Installer sur les iPhone (toi et Emy)
Ouvrir le lien dans **Safari** > Partager > **Sur l'écran d'accueil**. Noah choisit « Noah » > Créer notre espace, Emy choisit « Emy » > entre le code.

## 4. Rappel de 16h
Raccourcis > Automatisation > + > **Heure du jour** 16:00, tous les jours > **Exécuter immédiatement** > action **Ouvrir les URL** avec le lien de l'app. (Alternative : un rappel quotidien à 16h dans l'app Rappels, avec le lien en URL.)

## 5. Widget d'écran verrouillé
1. Installe **Scriptable** (App Store, gratuit). Nouveau script > colle `scriptable-widget.js`, remplis API_KEY, CODE et ME.
2. Écran verrouillé > appui long > Personnaliser > Écran verrouillé > ajoute un widget **Scriptable** (rectangulaire ou en ligne) > touche-le > Script : celui-ci.
3. iOS le rafraîchit environ toutes les 15 à 30 min : ce n'est pas instantané.
