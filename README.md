# Nous deux

## 1. Notifications push gratuites
Le dépôt est public : GitHub Actions utilise gratuitement les runners standards des dépôts publics. Les notifications sont vérifiées toutes les 5 minutes (GitHub peut parfois retarder un lancement). Firebase Cloud Messaging et le forfait Spark restent utilisés; aucune Cloud Function ni activation Blaze n’est nécessaire. Pour éviter tout frais, confirme que le projet Firebase est bien au forfait Spark. Si tu as déjà déployé les anciennes Cloud Functions, supprime-les dans Firebase Console avant de repasser à Spark. Firestore reste soumis aux quotas gratuits Spark; au-delà, les requêtes gratuites sont bloquées.

1. `index.html` et `firebase-messaging-sw.js` contiennent déjà la configuration Firebase. Dans Firebase Console > ⚙️ Paramètres du projet > **Cloud Messaging** > **Configuration Web** > **Certificats Web Push**, génère une paire de clés et copie la clé publique dans `VAPID_KEY` dans `index.html`. Si nécessaire, active l’API **FCM Registration** dans Google Cloud Console.
2. Dans Google Cloud Console > **IAM et administration > Comptes de service**, crée un compte dédié à ce poller et donne-lui les rôles **Firebase Cloud Messaging API Admin** et **Cloud Datastore User**. Crée une clé JSON pour ce compte.
3. Dans GitHub > dépôt > **Settings > Secrets and variables > Actions**, ajoute deux *secrets* :
   - `FIREBASE_SERVICE_ACCOUNT` : le contenu JSON complet de la clé.
   - `COUPLE_CODE` : le code à 6 caractères de votre espace.
   Ne mets jamais la clé JSON dans le dépôt ni dans un message. L’action ne journalise pas les prénoms ou le contenu des messages.
4. Publie les fichiers du dépôt sur GitHub Pages et active GitHub Actions si nécessaire. L’action **Push notifications** interroge Firestore toutes les 5 minutes et envoie des notifications génériques; elles n’affichent pas le texte privé des messages. Un marqueur Firestore évite de renvoyer les mêmes alertes. GitHub peut désactiver les workflows planifiés après 60 jours sans activité du dépôt; vérifie l’onglet **Actions** si les alertes s’arrêtent.
5. Authentication > Méthode de connexion > **Anonyme** doit être activé. Publie les règles de `firestore.rules` dans Firestore (Firebase Console > **Règles** ou `firebase deploy --only firestore:rules`).

## 2. Héberger gratuitement (GitHub Pages)
1. Publie tous les fichiers du dépôt sur GitHub (notamment `firebase-messaging-sw.js` et `manifest.webmanifest`), puis active **Settings > Pages > Branch `main` / root**.
2. Le lien est `https://TON-PSEUDO.github.io/nousdeux/` (1 à 2 min).
3. Si l'app affiche « auth/unauthorized-domain » : Firebase > Authentication > Paramètres > Domaines autorisés > ajoute `TON-PSEUDO.github.io`.

## 3. Installer sur les iPhone (toi et Ally)
Ouvrir le lien dans **Safari** > Partager > **Sur l'écran d'accueil**. Chacun choisit « Noah » ou « Ally », entre le prénom à afficher dans l'espace privé, puis crée l'espace ou rejoint avec le code de l'autre. Les notifications push sur iPhone nécessitent iOS 16.4 ou plus récent et l’app lancée depuis son icône sur l’écran d’accueil. Sur chaque iPhone, appuie sur **Activer les notifications** et accepte la demande iOS. Les notifications restent génériques et n’affichent pas le texte privé des messages.

## 4. Rappel de 16h
Raccourcis > Automatisation > + > **Heure du jour** 16:00, tous les jours > **Exécuter immédiatement** > action **Ouvrir les URL** avec le lien de l'app. (Alternative : un rappel quotidien à 16h dans l'app Rappels, avec le lien en URL.)

## 5. Widget d'écran verrouillé
Le widget d’écran verrouillé est fourni gratuitement par **Scriptable** (un site web ne peut pas installer son propre widget iOS).
1. Installe **Scriptable** depuis l’App Store et ouvre-le une fois. Dans l’app, touche **+**, crée un script nommé `Nous deux`, colle le contenu de `scriptable-widget.js`, puis enregistre-le. Renseigne `CODE` et `ME` (« Noah » ou « Ally »); `API_KEY` est déjà configurée. Touche **▶︎** pour exécuter le script une fois.
2. iOS 16 ou plus récent : verrouille l’iPhone, garde le doigt sur l’écran verrouillé > **Personnaliser** > **Écran verrouillé** > **Ajouter des widgets**. Cherche **Scriptable** dans la liste (ce n’est pas « Nous deux »), puis choisis le widget rectangulaire ou en ligne.
3. Avant de toucher **OK/Terminé**, touche le widget ajouté et, dans ses réglages, choisis le script `Nous deux`. Termine, puis touche le widget une fois pour lui permettre de charger les données.
4. Si **Scriptable** n’apparaît pas dans « Ajouter des widgets », vérifie qu’il est installé et à jour, ouvre-le une fois, puis redémarre l’iPhone. Le widget se configure dans l’écran verrouillé, pas dans l’écran d’accueil.
5. iOS décide quand rafraîchir le widget : l’intervalle demandé est d’environ 15 minutes, mais ce n’est pas instantané ni garanti.
