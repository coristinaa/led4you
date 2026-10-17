/*
 * LED4YOU translations for the app (Bluetooth) and the Studio page (Wi-Fi).
 * The pages are written in English; this file swaps visible text, placeholders, titles and
 * toast messages for the chosen language and keeps doing so for anything added later
 * (a MutationObserver watches the page). Elements inside [data-notr] are left alone
 * (effect names, palette names, names the user typed).
 * Usage: L4YI18n.picker() returns a <select> to change the language.
 */
(function () {
	const LANGS = { en: 'English', pt: 'Português', es: 'Español', fr: 'Français' };
	// [English, Português (PT), Español, Français]
	const T = [
		// --- start, connection, Wi-Fi ---
		['Lights', 'Luzes', 'Luces', 'Lumières'],
		['Not connected', 'Não ligado', 'No conectado', 'Non connecté'],
		['Connected', 'Ligado', 'Conectado', 'Connecté'],
		['Connecting…', 'A ligar…', 'Conectando…', 'Connexion…'],
		['No Bluetooth', 'Sem Bluetooth', 'Sin Bluetooth', 'Pas de Bluetooth'],
		['Install app', 'Instalar app', 'Instalar app', 'Installer l’app'],
		['Back to start', 'Voltar ao início', 'Volver al inicio', 'Retour au début'],
		['Find your lights', 'Encontra as tuas luzes', 'Encuentra tus luces', 'Trouvez vos lumières'],
		['Turn on Bluetooth and keep this phone close to your LED4YOU lights.', 'Liga o Bluetooth e mantém o telemóvel perto das tuas luzes LED4YOU.', 'Activa el Bluetooth y mantén el móvil cerca de tus luces LED4YOU.', 'Activez le Bluetooth et gardez le téléphone près de vos lumières LED4YOU.'],
		['Find lights', 'Procurar luzes', 'Buscar luces', 'Chercher les lumières'],
		['Lights already on your Wi-Fi? Open by address', 'As luzes já estão no teu Wi-Fi? Abrir pelo endereço', '¿Las luces ya están en tu Wi-Fi? Abrir por dirección', 'Lumières déjà sur votre Wi-Fi ? Ouvrir par adresse'],
		['Bluetooth not available here', 'Bluetooth indisponível aqui', 'Bluetooth no disponible aquí', 'Bluetooth indisponible ici'],
		['This browser cannot talk to Bluetooth devices. Open this page in', 'Este browser não fala com dispositivos Bluetooth. Abre esta página no', 'Este navegador no puede hablar con dispositivos Bluetooth. Abre esta página en', 'Ce navigateur ne peut pas parler aux appareils Bluetooth. Ouvrez cette page dans'],
		['or', 'ou', 'o', 'ou'],
		['on Android, Windows or Mac. On iPhone, open it in the free', 'no Android, Windows ou Mac. No iPhone, abre-a na app gratuita', 'en Android, Windows o Mac. En iPhone, ábrela en la app gratuita', 'sur Android, Windows ou Mac. Sur iPhone, ouvrez-la dans l’app gratuite'],
		['app.', '.', '.', '.'],
		['How do you want to use the lights?', 'Como queres usar as luzes?', '¿Cómo quieres usar las luces?', 'Comment voulez-vous utiliser les lumières ?'],
		['Continue with Bluetooth', 'Continuar por Bluetooth', 'Continuar por Bluetooth', 'Continuer en Bluetooth'],
		['Quick controls right here. No Wi-Fi needed.', 'Controlo rápido aqui mesmo. Sem precisar de Wi-Fi.', 'Control rápido aquí mismo. Sin Wi-Fi.', 'Contrôle rapide ici. Pas besoin de Wi-Fi.'],
		['Use Wi-Fi', 'Usar Wi-Fi', 'Usar Wi-Fi', 'Utiliser le Wi-Fi'],
		['Connect the lights to your Wi-Fi and open the full LED4YOU page.', 'Liga as luzes ao teu Wi-Fi e abre a página LED4YOU completa.', 'Conecta las luces a tu Wi-Fi y abre la página LED4YOU completa.', 'Connectez les lumières à votre Wi-Fi et ouvrez la page LED4YOU complète.'],
		['Connect the lights to your Wi-Fi', 'Ligar as luzes ao teu Wi-Fi', 'Conectar las luces a tu Wi-Fi', 'Connecter les lumières à votre Wi-Fi'],
		['Your home Wi-Fi', 'O Wi-Fi de casa', 'El Wi-Fi de casa', 'Le Wi-Fi de la maison'],
		['Network name (2.4 GHz)', 'Nome da rede (2,4 GHz)', 'Nombre de la red (2,4 GHz)', 'Nom du réseau (2,4 GHz)'],
		['Password', 'Palavra-passe', 'Contraseña', 'Mot de passe'],
		['Wi-Fi password', 'Palavra-passe do Wi-Fi', 'Contraseña del Wi-Fi', 'Mot de passe Wi-Fi'],
		['Send to LED4YOU', 'Enviar para o LED4YOU', 'Enviar al LED4YOU', 'Envoyer au LED4YOU'],
		['Your lights are on Wi-Fi', 'As tuas luzes estão no Wi-Fi', 'Tus luces están en el Wi-Fi', 'Vos lumières sont sur le Wi-Fi'],
		['Your lights joined the Wi-Fi.', 'As tuas luzes entraram no Wi-Fi.', 'Tus luces se unieron al Wi-Fi.', 'Vos lumières ont rejoint le Wi-Fi.'],
		['Open LED4YOU', 'Abrir LED4YOU', 'Abrir LED4YOU', 'Ouvrir LED4YOU'],
		['Use another network', 'Usar outra rede', 'Usar otra red', 'Utiliser un autre réseau'],
		['Connecting to your Wi-Fi. This takes up to 30 seconds.', 'A ligar ao teu Wi-Fi. Demora até 30 segundos.', 'Conectando a tu Wi-Fi. Tarda hasta 30 segundos.', 'Connexion à votre Wi-Fi. Cela prend jusqu’à 30 secondes.'],
		['The lights could not join that network. Check the name and password, and that it is a 2.4 GHz network.', 'As luzes não conseguiram entrar nessa rede. Confirma o nome, a palavra-passe e que é uma rede de 2,4 GHz.', 'Las luces no pudieron unirse a esa red. Revisa el nombre, la contraseña y que sea una red de 2,4 GHz.', 'Les lumières n’ont pas pu rejoindre ce réseau. Vérifiez le nom, le mot de passe et qu’il s’agit d’un réseau 2,4 GHz.'],
		['The network name is too long (32 characters maximum).', 'O nome da rede é demasiado longo (máximo 32 caracteres).', 'El nombre de la red es demasiado largo (máximo 32 caracteres).', 'Le nom du réseau est trop long (32 caractères maximum).'],
		['Lights on your Wi-Fi', 'Luzes no teu Wi-Fi', 'Luces en tu Wi-Fi', 'Lumières sur votre Wi-Fi'],
		['Address of the lights', 'Endereço das luzes', 'Dirección de las luces', 'Adresse des lumières'],
		['This phone must be on the same Wi-Fi network.', 'Este telemóvel tem de estar na mesma rede Wi-Fi.', 'Este móvil debe estar en la misma red Wi-Fi.', 'Ce téléphone doit être sur le même réseau Wi-Fi.'],
		['The address shows in your router\'s device list, or at the end of the Bluetooth Wi-Fi setup.', 'O endereço aparece na lista de dispositivos do router, ou no fim da configuração do Wi-Fi por Bluetooth.', 'La dirección aparece en la lista de dispositivos del router, o al final de la configuración del Wi-Fi por Bluetooth.', 'L’adresse figure dans la liste des appareils de votre box, ou à la fin de la configuration Wi-Fi par Bluetooth.'],
		['No home Wi-Fi nearby?', 'Sem Wi-Fi de casa por perto?', '¿No hay Wi-Fi de casa cerca?', 'Pas de Wi-Fi à proximité ?'],
		['Connect this phone to the Wi-Fi network', 'Liga o telemóvel à rede Wi-Fi', 'Conecta el móvil a la red Wi-Fi', 'Connectez le téléphone au réseau Wi-Fi'],
		['(password', '(palavra-passe', '(contraseña', '(mot de passe'],
		['), then open the lights\' own page.', ') e abre a página das luzes.', ') y abre la página de las luces.', '), puis ouvrez la page des lumières.'],
		['192.168.1.57 or led4you-243798.local', '192.168.1.57 ou led4you-243798.local', '192.168.1.57 o led4you-243798.local', '192.168.1.57 ou led4you-243798.local'],
		['WS2805 (RGB + 2 whites)', 'WS2805 (RGB + 2 brancos)', 'WS2805 (RGB + 2 blancos)', 'WS2805 (RVB + 2 blancs)'],
		['GEQ (matrix)', 'GEQ (matriz)', 'GEQ (matriz)', 'GEQ (matrice)'],
		['Open 4.3.2.1', 'Abrir 4.3.2.1', 'Abrir 4.3.2.1', 'Ouvrir 4.3.2.1'],
		['Reconnect', 'Voltar a ligar', 'Reconectar', 'Reconnecter'],
		['Bluetooth connection lost. Tap Reconnect.', 'A ligação Bluetooth caiu. Toca em Voltar a ligar.', 'Se perdió la conexión Bluetooth. Toca Reconectar.', 'Connexion Bluetooth perdue. Touchez Reconnecter.'],
		['Could not connect. Check that Bluetooth is on and the lights have firmware v7.', 'Não foi possível ligar. Confirma que o Bluetooth está ligado e que as luzes têm o firmware v7 ou mais recente.', 'No se pudo conectar. Comprueba que el Bluetooth está activado y que las luces tienen el firmware v7 o posterior.', 'Connexion impossible. Vérifiez que le Bluetooth est activé et que les lumières ont le firmware v7 ou plus récent.'],
		['No LED4YOU device chosen.', 'Nenhum LED4YOU escolhido.', 'Ningún LED4YOU elegido.', 'Aucun LED4YOU choisi.'],
		['Connected to', 'Ligado a', 'Conectado a', 'Connecté à'],
		// --- tabs ---
		['Controls', 'Controlo', 'Control', 'Contrôle'],
		['Text', 'Texto', 'Texto', 'Texte'],
		['My LEDs', 'Os meus LEDs', 'Mis LEDs', 'Mes LEDs'],
		['Images', 'Imagens', 'Imágenes', 'Images'],
		['More', 'Mais', 'Más', 'Plus'],
		['Setup', 'Configurar', 'Configurar', 'Réglages'],
		['GIFs', 'GIFs', 'GIFs', 'GIFs'],
		['House', 'Casa', 'Casa', 'Maison'],
		// --- controls ---
		['Brightness', 'Brilho', 'Brillo', 'Luminosité'],
		['Color', 'Cor', 'Color', 'Couleur'],
		['Pick a color', 'Escolhe uma cor', 'Elige un color', 'Choisissez une couleur'],
		['Effect', 'Efeito', 'Efecto', 'Effet'],
		['Effects', 'Efeitos', 'Efectos', 'Effets'],
		['Search effects', 'Procurar efeitos', 'Buscar efectos', 'Chercher un effet'],
		['Strip', 'Fita', 'Tira', 'Bande'],
		['Matrix', 'Matriz', 'Matriz', 'Matrice'],
		['Speed', 'Velocidade', 'Velocidad', 'Vitesse'],
		['Intensity', 'Intensidade', 'Intensidad', 'Intensité'],
		['Effect speed', 'Velocidade do efeito', 'Velocidad del efecto', 'Vitesse de l’effet'],
		['Effect intensity', 'Intensidade do efeito', 'Intensidad del efecto', 'Intensité de l’effet'],
		['Palette', 'Paleta', 'Paleta', 'Palette'],
		['Presets', 'Presets', 'Presets', 'Préréglages'],
		['Tap a number to load it.', 'Toca num número para o carregar.', 'Toca un número para cargarlo.', 'Touchez un numéro pour le charger.'],
		['Tap a number to save what the lights show now.', 'Toca num número para guardar o que as luzes mostram agora.', 'Toca un número para guardar lo que muestran las luces ahora.', 'Touchez un numéro pour enregistrer ce qu’affichent les lumières.'],
		['Save', 'Guardar', 'Guardar', 'Enregistrer'],
		['Cancel', 'Cancelar', 'Cancelar', 'Annuler'],
		['Delete', 'Apagar', 'Borrar', 'Supprimer'],
		['Tap to confirm', 'Toca para confirmar', 'Toca para confirmar', 'Touchez pour confirmer'],
		['Name for preset', 'Nome do preset', 'Nombre del preset', 'Nom du préréglage'],
		['Save here', 'Guardar aqui', 'Guardar aquí', 'Enregistrer ici'],
		['Could not send the command. Move closer and try again.', 'Não foi possível enviar. Aproxima-te e tenta outra vez.', 'No se pudo enviar. Acércate e inténtalo de nuevo.', 'Envoi impossible. Rapprochez-vous et réessayez.'],
		// --- images ---
		['Pixel art', 'Pixel art', 'Pixel art', 'Pixel art'],
		['Pick a photo or drawing. It is shrunk to your LEDs and shown right away.', 'Escolhe uma foto ou desenho. É reduzido aos teus LEDs e aparece logo.', 'Elige una foto o un dibujo. Se reduce a tus LEDs y aparece al momento.', 'Choisissez une photo ou un dessin. Elle est réduite à vos LEDs et affichée tout de suite.'],
		['Choose image', 'Escolher imagem', 'Elegir imagen', 'Choisir une image'],
		['Show on the lights', 'Mostrar nas luzes', 'Mostrar en las luces', 'Afficher sur les lumières'],
		['GIF animation', 'Animação GIF', 'Animación GIF', 'Animation GIF'],
		['Small GIFs made for LED matrices work best (up to 64 KB). The lights resize them to fit.', 'GIFs pequenos feitos para matrizes funcionam melhor (até 64 KB). As luzes ajustam o tamanho.', 'Los GIF pequeños hechos para matrices funcionan mejor (hasta 64 KB). Las luces los ajustan.', 'Les petits GIF faits pour matrices marchent le mieux (jusqu’à 64 Ko). Les lumières les adaptent.'],
		['Choose GIF', 'Escolher GIF', 'Elegir GIF', 'Choisir un GIF'],
		['On the lights', 'Nas luzes', 'En las luces', 'Sur les lumières'],
		['No GIFs stored yet.', 'Ainda não há GIFs guardados.', 'Aún no hay GIF guardados.', 'Aucun GIF enregistré.'],
		['Play', 'Tocar', 'Reproducir', 'Lire'],
		['Could not delete.', 'Não foi possível apagar.', 'No se pudo borrar.', 'Suppression impossible.'],
		['Could not send the GIF.', 'Não foi possível enviar o GIF.', 'No se pudo enviar el GIF.', 'Impossible d’envoyer le GIF.'],
		['The lights could not save the GIF.', 'As luzes não conseguiram guardar o GIF.', 'Las luces no pudieron guardar el GIF.', 'Les lumières n’ont pas pu enregistrer le GIF.'],
		['The lights refused the file.', 'As luzes recusaram o ficheiro.', 'Las luces rechazaron el archivo.', 'Les lumières ont refusé le fichier.'],
		['Not enough free space on the lights.', 'Não há espaço livre suficiente nas luzes.', 'No hay espacio libre suficiente en las luces.', 'Pas assez d’espace libre sur les lumières.'],
		['Done. To keep it, save a preset in the full LED4YOU page.', 'Feito. Para manter, guarda um preset na página LED4YOU completa.', 'Hecho. Para conservarlo, guarda un preset en la página LED4YOU completa.', 'Terminé. Pour le garder, enregistrez un préréglage dans la page LED4YOU complète.'],
		['This needs firmware v7 on the lights.', 'Isto precisa do firmware v7 ou mais recente nas luzes.', 'Esto necesita el firmware v7 o posterior en las luces.', 'Cela nécessite le firmware v7 ou plus récent.'],
		['GIF pack', 'Pack de GIFs', 'Pack de GIF', 'Pack de GIF'],
		['Tap an animation to send it to the lights and play it. Made for matrices; on a strip it is squeezed into one line.', 'Toca numa animação para a enviar às luzes e tocá-la. Feitas para matrizes; numa fita ficam espremidas numa linha.', 'Toca una animación para enviarla a las luces y reproducirla. Hechas para matrices; en una tira se comprimen en una línea.', 'Touchez une animation pour l’envoyer aux lumières et la lire. Faites pour les matrices ; sur une bande elle est compressée sur une ligne.'],
		['Add all', 'Juntar todos', 'Añadir todos', 'Tout ajouter'],
		['The GIF pack needs internet on this phone or computer.', 'O pack de GIFs precisa de internet neste telemóvel ou computador.', 'El pack de GIF necesita internet en este móvil u ordenador.', 'Le pack de GIF nécessite Internet sur ce téléphone ou cet ordinateur.'],
		['Stopped: not enough space or the lights did not answer.', 'Parado: falta espaço ou as luzes não responderam.', 'Detenido: falta espacio o las luces no respondieron.', 'Arrêté : pas assez d’espace ou les lumières n’ont pas répondu.'],
		['Halloween', 'Halloween', 'Halloween', 'Halloween'],
		['Christmas', 'Natal', 'Navidad', 'Noël'],
		['Celebrations', 'Festas', 'Fiestas', 'Fêtes'],
		['Pumpkin', 'Abóbora', 'Calabaza', 'Citrouille'], ['Ghost', 'Fantasma', 'Fantasma', 'Fantôme'], ['Bat', 'Morcego', 'Murciélago', 'Chauve-souris'],
		['Spider', 'Aranha', 'Araña', 'Araignée'], ['Skull', 'Caveira', 'Calavera', 'Crâne'], ['Cauldron', 'Caldeirão', 'Caldero', 'Chaudron'],
		['Eyes in the dark', 'Olhos no escuro', 'Ojos en la oscuridad', 'Yeux dans le noir'], ['Black cat', 'Gato preto', 'Gato negro', 'Chat noir'],
		['Graveyard', 'Cemitério', 'Cementerio', 'Cimetière'], ['Zombie hand', 'Mão de zombie', 'Mano de zombi', 'Main de zombie'],
		['Candy corn', 'Doce de milho', 'Caramelo de maíz', 'Bonbon maïs'], ['Witch hat', 'Chapéu de bruxa', 'Sombrero de bruja', 'Chapeau de sorcière'],
		['Full moon', 'Lua cheia', 'Luna llena', 'Pleine lune'], ['Christmas tree', 'Árvore de Natal', 'Árbol de Navidad', 'Sapin de Noël'],
		['Snowfall', 'Neve a cair', 'Nevada', 'Chute de neige'], ['Snowman', 'Boneco de neve', 'Muñeco de nieve', 'Bonhomme de neige'],
		['Present', 'Presente', 'Regalo', 'Cadeau'], ['Candy cane', 'Bengala doce', 'Bastón de caramelo', 'Sucre d’orge'], ['Star', 'Estrela', 'Estrella', 'Étoile'],
		['Bell', 'Sino', 'Campana', 'Cloche'], ['Ornament', 'Bola de Natal', 'Bola de Navidad', 'Boule de Noël'], ['Gingerbread', 'Boneco de gengibre', 'Galleta de jengibre', 'Bonhomme en pain d’épices'],
		['Holly', 'Azevinho', 'Acebo', 'Houx'], ['Wreath', 'Coroa de Natal', 'Corona de Navidad', 'Couronne'], ['Stocking', 'Meia de Natal', 'Calcetín de Navidad', 'Chaussette de Noël'],
		['Heart', 'Coração', 'Corazón', 'Cœur'], ['Fireworks', 'Fogo de artifício', 'Fuegos artificiales', 'Feu d’artifice'], ['Easter egg', 'Ovo da Páscoa', 'Huevo de Pascua', 'Œuf de Pâques'],
		['Confetti', 'Confetti', 'Confeti', 'Confettis'], ['Lucky clover', 'Trevo da sorte', 'Trébol de la suerte', 'Trèfle porte-bonheur'], ['Birthday cake', 'Bolo de anos', 'Tarta de cumpleaños', 'Gâteau d’anniversaire'],
		['Balloons', 'Balões', 'Globos', 'Ballons'], ['New Year 2027', 'Ano Novo 2027', 'Año Nuevo 2027', 'Nouvel An 2027'], ['Floating hearts', 'Corações a flutuar', 'Corazones flotando', 'Cœurs flottants'],
		['Bunny', 'Coelhinho', 'Conejito', 'Lapin'], ['Rainbow', 'Arco-íris', 'Arcoíris', 'Arc-en-ciel'], ['Sun', 'Sol', 'Sol', 'Soleil'],
		// --- setup ---
		['LED setup', 'Configuração dos LEDs', 'Configuración de LEDs', 'Réglage des LEDs'],
		['Data pin (GPIO)', 'Pino de dados (GPIO)', 'Pin de datos (GPIO)', 'Broche de données (GPIO)'],
		['LED chip', 'Chip dos LEDs', 'Chip de los LEDs', 'Puce LED'],
		['Color order', 'Ordem das cores', 'Orden de colores', 'Ordre des couleurs'],
		['GRB (most strips)', 'GRB (a maioria das fitas)', 'GRB (la mayoría de tiras)', 'GRB (la plupart des bandes)'],
		['Number of LEDs', 'Número de LEDs', 'Número de LEDs', 'Nombre de LEDs'],
		['LEDs form a matrix (panel)', 'Os LEDs formam uma matriz (painel)', 'Los LEDs forman una matriz (panel)', 'Les LEDs forment une matrice (panneau)'],
		['Width (LEDs)', 'Largura (LEDs)', 'Ancho (LEDs)', 'Largeur (LEDs)'],
		['Height (LEDs)', 'Altura (LEDs)', 'Alto (LEDs)', 'Hauteur (LEDs)'],
		['First LED', 'Primeiro LED', 'Primer LED', 'Première LED'],
		['Top left', 'Cima à esquerda', 'Arriba a la izquierda', 'En haut à gauche'],
		['Top right', 'Cima à direita', 'Arriba a la derecha', 'En haut à droite'],
		['Bottom left', 'Baixo à esquerda', 'Abajo a la izquierda', 'En bas à gauche'],
		['Bottom right', 'Baixo à direita', 'Abajo a la derecha', 'En bas à droite'],
		['Zigzag wiring (serpentine)', 'Ligação em ziguezague (serpentina)', 'Cableado en zigzag (serpentina)', 'Câblage en zigzag (serpentin)'],
		['Power limit (mA, 0 = no limit)', 'Limite de corrente (mA, 0 = sem limite)', 'Límite de corriente (mA, 0 = sin límite)', 'Limite de courant (mA, 0 = sans limite)'],
		['USB from a computer gives about 500 mA, a phone charger 1000 to 2000 mA.', 'A USB de um computador dá cerca de 500 mA, um carregador de telemóvel 1000 a 2000 mA.', 'El USB de un ordenador da unos 500 mA, un cargador de móvil de 1000 a 2000 mA.', 'L’USB d’un ordinateur fournit environ 500 mA, un chargeur de téléphone 1000 à 2000 mA.'],
		['The lights restart after saving. Reconnect after a few seconds.', 'As luzes reiniciam depois de guardar. Volta a ligar após alguns segundos.', 'Las luces se reinician al guardar. Reconecta tras unos segundos.', 'Les lumières redémarrent après l’enregistrement. Reconnectez-vous après quelques secondes.'],
		['Save and restart', 'Guardar e reiniciar', 'Guardar y reiniciar', 'Enregistrer et redémarrer'],
		['Tap again to save and restart', 'Toca outra vez para guardar e reiniciar', 'Toca de nuevo para guardar y reiniciar', 'Touchez encore pour enregistrer et redémarrer'],
		['Saved. The lights are restarting. Tap Reconnect in a few seconds.', 'Guardado. As luzes estão a reiniciar. Toca em Voltar a ligar daqui a uns segundos.', 'Guardado. Las luces se están reiniciando. Toca Reconectar en unos segundos.', 'Enregistré. Les lumières redémarrent. Touchez Reconnecter dans quelques secondes.'],
		['Could not send the settings. Move closer and try again.', 'Não foi possível enviar as definições. Aproxima-te e tenta outra vez.', 'No se pudo enviar la configuración. Acércate e inténtalo de nuevo.', 'Impossible d’envoyer les réglages. Rapprochez-vous et réessayez.'],
		// --- Studio: text and My LEDs ---
		['Message', 'Mensagem', 'Mensaje', 'Message'],
		['Text color', 'Cor do texto', 'Color del texto', 'Couleur du texte'],
		['Letter size', 'Tamanho das letras', 'Tamaño de letra', 'Taille des lettres'],
		['Show text', 'Mostrar texto', 'Mostrar texto', 'Afficher le texte'],
		['Text needs a matrix. Set the matrix size in LED setup first.', 'O texto precisa de uma matriz. Define primeiro o tamanho da matriz na configuração dos LEDs.', 'El texto necesita una matriz. Define primero el tamaño de la matriz en la configuración.', 'Le texte nécessite une matrice. Réglez d’abord sa taille dans les réglages des LEDs.'],
		['Type a message first.', 'Escreve primeiro uma mensagem.', 'Escribe primero un mensaje.', 'Tapez d’abord un message.'],
		['Showing your text.', 'A mostrar o teu texto.', 'Mostrando tu texto.', 'Votre texte s’affiche.'],
		['Could not send the text.', 'Não foi possível enviar o texto.', 'No se pudo enviar el texto.', 'Impossible d’envoyer le texte.'],
		['Select', 'Selecionar', 'Seleccionar', 'Sélection'],
		['Draw', 'Desenhar', 'Dibujar', 'Dessiner'],
		['Erase', 'Apagar', 'Borrar', 'Gommer'],
		['Brush', 'Pincel', 'Pincel', 'Pinceau'],
		['Tap LEDs to select them, then pick a color and how they behave.', 'Toca nos LEDs para os selecionar e escolhe a cor e o comportamento.', 'Toca los LEDs para seleccionarlos y elige el color y cómo se comportan.', 'Touchez les LEDs pour les sélectionner, puis choisissez la couleur et le comportement.'],
		['Drag your finger over the LEDs to paint. The lights follow as you draw.', 'Arrasta o dedo sobre os LEDs para pintar. As luzes acompanham enquanto desenhas.', 'Arrastra el dedo sobre los LEDs para pintar. Las luces siguen tu dibujo.', 'Faites glisser le doigt sur les LEDs pour peindre. Les lumières suivent votre dessin.'],
		['Drag over LEDs to switch them off.', 'Arrasta sobre os LEDs para os apagar.', 'Arrastra sobre los LEDs para apagarlos.', 'Glissez sur les LEDs pour les éteindre.'],
		['Select all', 'Selecionar todos', 'Seleccionar todos', 'Tout sélectionner'],
		['Clear selection', 'Limpar seleção', 'Quitar selección', 'Effacer la sélection'],
		['No LEDs selected', 'Nenhum LED selecionado', 'Ningún LED seleccionado', 'Aucune LED sélectionnée'],
		['Selected LEDs', 'LEDs selecionados', 'LEDs seleccionados', 'LEDs sélectionnées'],
		['Paint with', 'Pintar com', 'Pintar con', 'Peindre avec'],
		['Eraser', 'Borracha', 'Goma', 'Gomme'],
		['LED color', 'Cor do LED', 'Color del LED', 'Couleur de la LED'],
		['Fixed', 'Fixo', 'Fijo', 'Fixe'],
		['Blink', 'Piscar', 'Parpadeo', 'Clignote'],
		['Breathe', 'Respirar', 'Respirar', 'Respire'],
		['Twinkle', 'Cintilar', 'Centelleo', 'Scintille'],
		['slow → fast', 'lento → rápido', 'lento → rápido', 'lent → rapide'],
		['Wave: stagger the timing along the selection', 'Onda: desfasar o tempo ao longo da seleção', 'Onda: desfasar el tiempo a lo largo de la selección', 'Vague : décaler le rythme le long de la sélection'],
		['Apply to selected', 'Aplicar aos selecionados', 'Aplicar a los seleccionados', 'Appliquer à la sélection'],
		['Send to lights', 'Enviar para as luzes', 'Enviar a las luces', 'Envoyer aux lumières'],
		['Turn all off', 'Apagar todos', 'Apagar todos', 'Tout éteindre'],
		['Sending…', 'A enviar…', 'Enviando…', 'Envoi…'],
		['Done. Your design is playing and stays saved on the lights.', 'Feito. O teu desenho está a tocar e fica guardado nas luzes.', 'Hecho. Tu diseño se está mostrando y queda guardado en las luces.', 'Terminé. Votre création s’affiche et reste enregistrée sur les lumières.'],
		['The lights did not accept the design. Try again.', 'As luzes não aceitaram o desenho. Tenta outra vez.', 'Las luces no aceptaron el diseño. Inténtalo de nuevo.', 'Les lumières n’ont pas accepté la création. Réessayez.'],
		['Could not send. Move closer and try again.', 'Não foi possível enviar. Aproxima-te e tenta outra vez.', 'No se pudo enviar. Acércate e inténtalo de nuevo.', 'Envoi impossible. Rapprochez-vous et réessayez.'],
		['Could not send. Move closer to the lights and try again.', 'Não foi possível enviar. Aproxima-te das luzes e tenta outra vez.', 'No se pudo enviar. Acércate a las luces e inténtalo de nuevo.', 'Envoi impossible. Rapprochez-vous des lumières et réessayez.'],
		['Could not send.', 'Não foi possível enviar.', 'No se pudo enviar.', 'Envoi impossible.'],
		['All LEDs set to off. Tap "Send to lights" to keep it.', 'Todos os LEDs apagados. Toca em "Enviar para as luzes" para manter.', 'Todos los LEDs apagados. Toca "Enviar a las luces" para conservarlo.', 'Toutes les LEDs éteintes. Touchez « Envoyer aux lumières » pour le garder.'],
		['Could not read the lights. Reload the page.', 'Não foi possível ler as luzes. Recarrega a página.', 'No se pudieron leer las luces. Recarga la página.', 'Impossible de lire les lumières. Rechargez la page.'],
		['← Lights', '← Luzes', '← Luces', '← Lumières'],
		// --- More: extras ---
		['Sleep timer', 'Temporizador', 'Temporizador', 'Minuterie'],
		['Fade out and switch off after:', 'Escurecer e desligar daqui a:', 'Atenuar y apagar dentro de:', 'Atténuer et éteindre après :'],
		['Off', 'Desligado', 'Apagado', 'Arrêt'],
		['Sleep timer off.', 'Temporizador desligado.', 'Temporizador apagado.', 'Minuterie désactivée.'],
		['Seasons', 'Épocas', 'Temporadas', 'Saisons'],
		['Pumpkin glow', 'Abóbora a brilhar', 'Calabaza brillante', 'Citrouille lumineuse'],
		['Haunted', 'Assombrado', 'Embrujado', 'Hanté'],
		['Spooky eyes', 'Olhos assustadores', 'Ojos espeluznantes', 'Yeux effrayants'],
		['Storm', 'Tempestade', 'Tormenta', 'Orage'],
		['Witch brew', 'Poção de bruxa', 'Pócima de bruja', 'Potion de sorcière'],
		['Retro tree', 'Árvore retro', 'Árbol retro', 'Sapin rétro'],
		['Merry twinkle', 'Cintilar de Natal', 'Destello navideño', 'Scintillement de Noël'],
		['Fireplace', 'Lareira', 'Chimenea', 'Cheminée'],
		['Update the lights to the newest LED4YOU for this theme.', 'Atualiza as luzes para o LED4YOU mais recente para usar este tema.', 'Actualiza las luces al LED4YOU más reciente para este tema.', 'Mettez les lumières à jour vers le dernier LED4YOU pour ce thème.'],
		['Schedule', 'Horário', 'Horario', 'Programmation'],
		['Switch on', 'Ligar', 'Encender', 'Allumer'],
		['Switch off', 'Desligar', 'Apagar', 'Éteindre'],
		['At a time', 'A uma hora', 'A una hora', 'À une heure'],
		['At sunset', 'Ao pôr do sol', 'Al atardecer', 'Au coucher du soleil'],
		['At sunrise', 'Ao nascer do sol', 'Al amanecer', 'Au lever du soleil'],
		['Time', 'Hora', 'Hora', 'Heure'],
		['Minutes after sunset (−before)', 'Minutos depois do pôr do sol (−antes)', 'Minutos tras el atardecer (−antes)', 'Minutes après le coucher (−avant)'],
		['Minutes after sunrise (−before)', 'Minutos depois do nascer do sol (−antes)', 'Minutos tras el amanecer (−antes)', 'Minutes après le lever (−avant)'],
		['Show', 'Mostrar', 'Mostrar', 'Afficher'],
		['Just switch on', 'Só ligar', 'Solo encender', 'Juste allumer'],
		['Days', 'Dias', 'Días', 'Jours'],
		['Sunday', 'Domingo', 'Domingo', 'Dimanche'], ['Monday', 'Segunda', 'Lunes', 'Lundi'], ['Tuesday', 'Terça', 'Martes', 'Mardi'],
		['Wednesday', 'Quarta', 'Miércoles', 'Mercredi'], ['Thursday', 'Quinta', 'Jueves', 'Jeudi'], ['Friday', 'Sexta', 'Viernes', 'Vendredi'], ['Saturday', 'Sábado', 'Sábado', 'Samedi'],
		['Whole house: switch every LED4YOU light (scene with the same preset number)', 'Casa toda: ligar/desligar todas as luzes LED4YOU (cena com o mesmo número de preset)', 'Toda la casa: todas las luces LED4YOU (escena con el mismo número de preset)', 'Toute la maison : toutes les lumières LED4YOU (scène avec le même numéro)'],
		['Save schedule', 'Guardar horário', 'Guardar horario', 'Enregistrer'],
		['Use my location for sunset', 'Usar a minha localização para o pôr do sol', 'Usar mi ubicación para el atardecer', 'Utiliser ma position pour le coucher du soleil'],
		['Schedule saved on the lights.', 'Horário guardado nas luzes.', 'Horario guardado en las luces.', 'Programmation enregistrée sur les lumières.'],
		['Location saved. Sunset times are ready.', 'Localização guardada. As horas do pôr do sol estão prontas.', 'Ubicación guardada. Las horas del atardecer están listas.', 'Position enregistrée. Les heures du coucher du soleil sont prêtes.'],
		['Location was not allowed.', 'A localização não foi autorizada.', 'No se permitió la ubicación.', 'La position n’a pas été autorisée.'],
		['This browser cannot share the location.', 'Este browser não consegue partilhar a localização.', 'Este navegador no puede compartir la ubicación.', 'Ce navigateur ne peut pas partager la position.'],
		['The lights do not know the time yet. Saving sends the time from this phone.', 'As luzes ainda não sabem as horas. Ao guardar, recebem a hora deste telemóvel.', 'Las luces aún no saben la hora. Al guardar reciben la hora de este móvil.', 'Les lumières ne connaissent pas encore l’heure. L’enregistrement envoie l’heure de ce téléphone.'],
		['Countdown', 'Contagem decrescente', 'Cuenta atrás', 'Compte à rebours'],
		['Label', 'Etiqueta', 'Etiqueta', 'Libellé'],
		['Count down to', 'Contar até', 'Contar hasta', 'Jusqu’à'],
		['Countdown color', 'Cor da contagem', 'Color de la cuenta atrás', 'Couleur du compte à rebours'],
		['Start countdown', 'Começar contagem', 'Iniciar cuenta atrás', 'Démarrer'],
		['Stop', 'Parar', 'Parar', 'Arrêter'],
		['Countdown started.', 'Contagem iniciada.', 'Cuenta atrás iniciada.', 'Compte à rebours démarré.'],
		['Countdown stopped.', 'Contagem parada.', 'Cuenta atrás detenida.', 'Compte à rebours arrêté.'],
		['Pick a date and time.', 'Escolhe uma data e hora.', 'Elige una fecha y hora.', 'Choisissez une date et une heure.'],
		['Needs a matrix: the countdown scrolls as text.', 'Precisa de uma matriz: a contagem passa como texto.', 'Necesita una matriz: la cuenta atrás se muestra como texto.', 'Nécessite une matrice : le compte à rebours défile en texte.'],
		['House scenes', 'Cenas da casa', 'Escenas de la casa', 'Scènes de la maison'],
		['One tap changes every LED4YOU light on your Wi-Fi. Each light plays its own preset with the same number, so save preset 1 as "Halloween" on every light (pumpkin GIF on the window, orange chase on the roof, purple on the trees…).', 'Um toque muda todas as luzes LED4YOU no teu Wi-Fi. Cada uma toca o seu preset com o mesmo número: guarda o preset 1 como "Halloween" em todas (GIF da abóbora na janela, laranja no telhado, roxo nas árvores…).', 'Un toque cambia todas las luces LED4YOU de tu Wi-Fi. Cada una reproduce su propio preset con el mismo número: guarda el preset 1 como "Halloween" en todas (GIF de calabaza en la ventana, naranja en el tejado, morado en los árboles…).', 'Un geste change toutes les lumières LED4YOU de votre Wi-Fi. Chacune joue son propre préréglage du même numéro : enregistrez le 1 comme « Halloween » partout (citrouille à la fenêtre, orange sur le toit, violet dans les arbres…).'],
		['All off', 'Desligar tudo', 'Apagar todo', 'Tout éteindre'],
		['House settings', 'Definições da casa', 'Ajustes de la casa', 'Réglages de la maison'],
		['This light follows house scenes', 'Esta luz segue as cenas da casa', 'Esta luz sigue las escenas de la casa', 'Cette lumière suit les scènes de la maison'],
		['House number (change it only if a neighbour also has LED4YOU)', 'Número da casa (muda só se um vizinho também tiver LED4YOU)', 'Número de casa (cámbialo solo si un vecino también tiene LED4YOU)', 'Numéro de maison (à changer seulement si un voisin a aussi LED4YOU)'],
		['Whole house off.', 'Casa toda desligada.', 'Toda la casa apagada.', 'Toute la maison éteinte.'],
		['Preset loop', 'Sequência de presets', 'Bucle de presets', 'Boucle de préréglages'],
		['Shows your saved presets one after another, forever.', 'Mostra os teus presets guardados uns a seguir aos outros, sem parar.', 'Muestra tus presets guardados uno tras otro, sin fin.', 'Affiche vos préréglages l’un après l’autre, en boucle.'],
		['Time per preset', 'Tempo por preset', 'Tiempo por preset', 'Durée par préréglage'],
		['Seconds per preset', 'Segundos por preset', 'Segundos por preset', 'Secondes par préréglage'],
		['Start loop', 'Começar sequência', 'Iniciar bucle', 'Démarrer la boucle'],
		['Loop stopped.', 'Sequência parada.', 'Bucle detenido.', 'Boucle arrêtée.'],
		['Save at least two presets first.', 'Guarda primeiro pelo menos dois presets.', 'Guarda primero al menos dos presets.', 'Enregistrez d’abord au moins deux préréglages.'],
		['running', 'a correr', 'en marcha', 'en cours'],
		['Sound', 'Som', 'Sonido', 'Son'],
		['Effects that move with music. Connect a microphone first and set its pins below.', 'Efeitos que mexem com a música. Liga primeiro um microfone e define os pinos em baixo.', 'Efectos que se mueven con la música. Conecta primero un micrófono y configura sus pines abajo.', 'Effets qui bougent avec la musique. Branchez d’abord un micro et réglez ses broches ci-dessous.'],
		['Microphone setup', 'Configurar microfone', 'Configurar micrófono', 'Réglage du micro'],
		['Microphone on', 'Microfone ligado', 'Micrófono activado', 'Micro activé'],
		['Type', 'Tipo', 'Tipo', 'Type'],
		['I2S microphone (INMP441, ICS-43434)', 'Microfone I2S (INMP441, ICS-43434)', 'Micrófono I2S (INMP441, ICS-43434)', 'Micro I2S (INMP441, ICS-43434)'],
		['PDM microphone (no SCK)', 'Microfone PDM (sem SCK)', 'Micrófono PDM (sin SCK)', 'Micro PDM (sans SCK)'],
		['I2S with MCLK (line-in boards)', 'I2S com MCLK (placas de entrada de linha)', 'I2S con MCLK (placas de entrada de línea)', 'I2S avec MCLK (cartes entrée ligne)'],
		['SD (data)', 'SD (dados)', 'SD (datos)', 'SD (données)'],
		['Gain (sensitivity)', 'Ganho (sensibilidade)', 'Ganancia (sensibilidad)', 'Gain (sensibilité)'],
		['Microphone gain', 'Ganho do microfone', 'Ganancia del micrófono', 'Gain du micro'],
		['Noise gate', 'Filtro de ruído', 'Filtro de ruido', 'Seuil de bruit'],
		['Do not use the LED data pin, GPIO 9 (boot button) or GPIO 8 (onboard LED).', 'Não uses o pino de dados dos LEDs, o GPIO 9 (botão BOOT) nem o GPIO 8 (LED da placa).', 'No uses el pin de datos de los LEDs, el GPIO 9 (botón BOOT) ni el GPIO 8 (LED de la placa).', 'N’utilisez pas la broche de données des LEDs, le GPIO 9 (bouton BOOT) ni le GPIO 8 (LED de la carte).'],
		['The lights restart to apply this. Tap again to confirm.', 'As luzes reiniciam para aplicar isto. Toca outra vez para confirmar.', 'Las luces se reinician para aplicarlo. Toca de nuevo para confirmar.', 'Les lumières redémarrent pour l’appliquer. Touchez encore pour confirmer.'],
		['Saved. The lights restart now.', 'Guardado. As luzes vão reiniciar.', 'Guardado. Las luces se reinician ahora.', 'Enregistré. Les lumières redémarrent.'],
		['Motion scare', 'Susto com movimento', 'Susto con movimiento', 'Frayeur au mouvement'],
		['A motion sensor (PIR, e.g. HC-SR501 or AM312) plays a preset when someone walks by, then the lights go back to what they showed.', 'Um sensor de movimento (PIR, ex. HC-SR501 ou AM312) toca um preset quando alguém passa e depois as luzes voltam ao que estavam.', 'Un sensor de movimiento (PIR, p. ej. HC-SR501 o AM312) reproduce un preset cuando alguien pasa y luego las luces vuelven a lo que mostraban.', 'Un détecteur de mouvement (PIR, ex. HC-SR501 ou AM312) joue un préréglage quand quelqu’un passe, puis les lumières reviennent à leur état.'],
		['Sensor on', 'Sensor ligado', 'Sensor activado', 'Détecteur activé'],
		['Sensor pin (OUT)', 'Pino do sensor (OUT)', 'Pin del sensor (OUT)', 'Broche du détecteur (OUT)'],
		['Seconds', 'Segundos', 'Segundos', 'Secondes'],
		['Preset to play', 'Preset a tocar', 'Preset a reproducir', 'Préréglage à jouer'],
		['Only after sunset', 'Só depois do pôr do sol', 'Solo tras el atardecer', 'Seulement après le coucher du soleil'],
		['Test', 'Testar', 'Probar', 'Tester'],
		['Motion sensor saved.', 'Sensor de movimento guardado.', 'Sensor de movimiento guardado.', 'Détecteur enregistré.'],
		['Playing the scare preset.', 'A tocar o preset do susto.', 'Reproduciendo el preset del susto.', 'Lecture du préréglage frayeur.'],
		['scaring now', 'a assustar', 'asustando', 'en action'],
		['Light group', 'Grupo de luzes', 'Grupo de luces', 'Groupe de lumières'],
		['Several LED4YOU lights on the same Wi-Fi can change together. Turn on "Lead" on the one you control and "Follow" on the others.', 'Várias luzes LED4YOU no mesmo Wi-Fi podem mudar em conjunto. Ativa "Lead" na que controlas e "Follow" nas outras.', 'Varias luces LED4YOU en el mismo Wi-Fi pueden cambiar juntas. Activa "Lead" en la que controlas y "Follow" en las demás.', 'Plusieurs lumières LED4YOU sur le même Wi-Fi peuvent changer ensemble. Activez « Lead » sur celle que vous contrôlez et « Follow » sur les autres.'],
		['Lead: send my changes to the other lights', 'Lead: enviar as minhas mudanças às outras luzes', 'Lead: enviar mis cambios a las otras luces', 'Lead : envoyer mes changements aux autres lumières'],
		['Follow: copy changes from other lights', 'Follow: copiar as mudanças das outras luzes', 'Follow: copiar los cambios de otras luces', 'Follow : copier les changements des autres lumières'],
		['Saved.', 'Guardado.', 'Guardado.', 'Enregistré.'],
		['Power', 'Consumo', 'Consumo', 'Consommation'],
		['Estimated current. The limit is set in LED setup.', 'Corrente estimada. O limite define-se na configuração dos LEDs.', 'Corriente estimada. El límite se ajusta en la configuración de LEDs.', 'Courant estimé. La limite se règle dans les réglages des LEDs.'],
		['At the limit: the lights are dimmed to protect the power supply.', 'No limite: as luzes escurecem para proteger a fonte.', 'En el límite: las luces se atenúan para proteger la fuente.', 'À la limite : les lumières sont atténuées pour protéger l’alimentation.'],
		['No current limit set. Set one in LED setup to protect the power supply.', 'Sem limite de corrente. Define um na configuração dos LEDs para proteger a fonte.', 'Sin límite de corriente. Define uno en la configuración para proteger la fuente.', 'Aucune limite de courant. Réglez-en une pour protéger l’alimentation.'],
		['Could not reach the lights.', 'Não foi possível chegar às luzes.', 'No se pudo llegar a las luces.', 'Impossible de joindre les lumières.'],
		// --- Studio: House (Wi-Fi) ---
		['My house', 'A minha casa', 'Mi casa', 'Ma maison'],
		['Every light on your Wi-Fi. Give each one a clear name (Roof, Garden tree, Window…). The numbers show which presets each light has: for house scenes, save the same number on every light.', 'Todas as luzes do teu Wi-Fi. Dá a cada uma um nome claro (Telhado, Árvore do jardim, Janela…). Os números mostram que presets cada uma tem: para as cenas da casa, guarda o mesmo número em todas.', 'Todas las luces de tu Wi-Fi. Dale a cada una un nombre claro (Tejado, Árbol del jardín, Ventana…). Los números muestran qué presets tiene cada una: para las escenas, guarda el mismo número en todas.', 'Toutes les lumières de votre Wi-Fi. Donnez à chacune un nom clair (Toit, Arbre du jardin, Fenêtre…). Les numéros montrent les préréglages de chacune : pour les scènes, enregistrez le même numéro partout.'],
		['Search again', 'Procurar outra vez', 'Buscar de nuevo', 'Chercher à nouveau'],
		['Open', 'Abrir', 'Abrir', 'Ouvrir'],
		['Looking for lights…', 'A procurar luzes…', 'Buscando luces…', 'Recherche des lumières…'],
		['This light', 'Esta luz', 'Esta luz', 'Cette lumière'],
		['xLights can control this light', 'O xLights pode controlar esta luz', 'xLights puede controlar esta luz', 'xLights peut contrôler cette lumière'],
		['Name saved.', 'Nome guardado.', 'Nombre guardado.', 'Nom enregistré.'],
		['Only this light was found. Other lights appear here about a minute after they start. In Config → Sync Interfaces → Instance List, "Enable instance list" and "Make this instance discoverable" must be on (they are by default).', 'Só foi encontrada esta luz. As outras aparecem cerca de um minuto depois de ligarem. Em Config → Sync Interfaces → Instance List, "Enable instance list" e "Make this instance discoverable" têm de estar ativos (estão por defeito).', 'Solo se encontró esta luz. Las demás aparecen un minuto después de encenderse. En Config → Sync Interfaces → Instance List deben estar activados "Enable instance list" y "Make this instance discoverable" (lo están por defecto).', 'Seule cette lumière a été trouvée. Les autres apparaissent environ une minute après leur démarrage. Dans Config → Sync Interfaces → Instance List, « Enable instance list » et « Make this instance discoverable » doivent être activés (ils le sont par défaut).'],
		['xLights show', 'Espetáculo xLights', 'Espectáculo xLights', 'Spectacle xLights'],
		['For shows timed to music, xLights on your computer sends the animation to every light at once. While it plays, the lights follow xLights; when it stops they go back to their own effect.', 'Para espetáculos ao ritmo da música, o xLights no computador envia a animação para todas as luzes ao mesmo tempo. Enquanto toca, as luzes seguem o xLights; quando para, voltam ao seu efeito.', 'Para espectáculos al ritmo de la música, xLights en tu ordenador envía la animación a todas las luces a la vez. Mientras suena, las luces siguen a xLights; al parar vuelven a su efecto.', 'Pour des spectacles en musique, xLights sur votre ordinateur envoie l’animation à toutes les lumières à la fois. Pendant la lecture elles suivent xLights, puis reviennent à leur effet.'],
		['In xLights (Setup → Controllers → Add Ethernet), one controller per light:', 'No xLights (Setup → Controllers → Add Ethernet), um controlador por luz:', 'En xLights (Setup → Controllers → Add Ethernet), un controlador por luz:', 'Dans xLights (Setup → Controllers → Add Ethernet), un contrôleur par lumière :'],
		['empty', 'vazio', 'vacío', 'vide'],
		['Saved on the lights. Keep drawing or pick another behaviour.', 'Guardado nas luzes. Continua a desenhar ou escolhe outro comportamento.', 'Guardado en las luces. Sigue dibujando o elige otro comportamiento.', 'Enregistré sur les lumières. Continuez à dessiner ou choisissez un autre comportement.'],
		// --- own images and GIFs ---
		['Your image', 'A tua imagem', 'Tu imagen', 'Votre image'],
		['Your GIF', 'O teu GIF', 'Tu GIF', 'Votre GIF'],
		['Keep on the lights', 'Manter nas luzes', 'Conservar en las luces', 'Garder sur les lumières'],
		['Showing your image. Tap "Keep on the lights" to keep it after a restart.', 'A mostrar a tua imagem. Toca em "Manter nas luzes" para ficar mesmo depois de reiniciar.', 'Mostrando tu imagen. Toca "Conservar en las luces" para que siga tras reiniciar.', 'Votre image s’affiche. Touchez « Garder sur les lumières » pour la conserver après un redémarrage.'],
		['Kept. It is now your My LEDs design.', 'Guardada. É agora o teu desenho de "Os meus LEDs".', 'Guardada. Ahora es tu diseño de "Mis LEDs".', 'Conservée. C’est maintenant votre création « Mes LEDs ».'],
		// --- house scenes ---
		['Easter', 'Páscoa', 'Pascua', 'Pâques'],
		['New Year', 'Ano Novo', 'Año Nuevo', 'Nouvel An'],
		["Valentine's Day", 'Dia dos Namorados', 'San Valentín', 'Saint-Valentin'],
		['Birthday', 'Aniversário', 'Cumpleaños', 'Anniversaire'],
		['Every day', 'Dia a dia', 'Diario', 'Tous les jours'],
		['Party', 'Festa', 'Fiesta', 'Fête'],
		['✓ Ready on this light', '✓ Pronta nesta luz', '✓ Lista en esta luz', '✓ Prête sur cette lumière'],
		['Not saved on this light', 'Ainda não guardada nesta luz', 'Aún no guardada en esta luz', 'Pas encore enregistrée ici'],
		['Save again', 'Guardar outra vez', 'Guardar de nuevo', 'Réenregistrer'],
		['On each light, make it look the way you want, then tap "Save here" on the scene.', 'Em cada luz, deixa-a como queres e toca em "Guardar aqui" na cena.', 'En cada luz, déjala como quieras y toca "Guardar aquí" en la escena.', 'Sur chaque lumière, réglez l’apparence voulue puis touchez « Enregistrer ici » sur la scène.'],
		['Tap a scene to change every LED4YOU light at once. Each light shows its own look.', 'Toca numa cena para mudar todas as luzes LED4YOU de uma vez. Cada luz mostra o seu visual.', 'Toca una escena para cambiar todas las luces LED4YOU a la vez. Cada luz muestra su propio aspecto.', 'Touchez une scène pour changer toutes les lumières LED4YOU d’un coup. Chacune affiche son propre rendu.'],
		['Every light on your Wi-Fi. Give each one a clear name (Roof, Garden tree, Window…). The icons show which house scenes each light already has (bright = saved).', 'Todas as luzes do teu Wi-Fi. Dá a cada uma um nome claro (Telhado, Árvore do jardim, Janela…). Os ícones mostram que cenas cada luz já tem (aceso = guardada).', 'Todas las luces de tu Wi-Fi. Dale a cada una un nombre claro (Tejado, Árbol del jardín, Ventana…). Los iconos muestran qué escenas tiene cada luz (encendido = guardada).', 'Toutes les lumières de votre Wi-Fi. Donnez à chacune un nom clair (Toit, Arbre du jardin, Fenêtre…). Les icônes montrent les scènes déjà enregistrées (allumée = enregistrée).'],
		// --- firmware update ---
		['Update available', 'Atualização disponível', 'Actualización disponible', 'Mise à jour disponible'],
		['Update now', 'Atualizar agora', 'Actualizar ahora', 'Mettre à jour'],
		['Tap again to start', 'Toca outra vez para começar', 'Toca de nuevo para empezar', 'Touchez encore pour commencer'],
		['Do not switch the lights off during the update.', 'Não desligues as luzes durante a atualização.', 'No apagues las luces durante la actualización.', 'N’éteignez pas les lumières pendant la mise à jour.'],
		['Updated. The lights restart…', 'Atualizado. As luzes estão a reiniciar…', 'Actualizado. Las luces se reinician…', 'Mis à jour. Les lumières redémarrent…'],
		['The lights restarted. Reload the page in a moment.', 'As luzes reiniciaram. Recarrega a página daqui a pouco.', 'Las luces se reiniciaron. Recarga la página en un momento.', 'Les lumières ont redémarré. Rechargez la page dans un instant.'],
		['The update could not be downloaded. Check the internet on this phone or computer.', 'Não foi possível descarregar a atualização. Confirma a internet neste telemóvel ou computador.', 'No se pudo descargar la actualización. Revisa internet en este móvil u ordenador.', 'Impossible de télécharger la mise à jour. Vérifiez Internet sur cet appareil.'],
		['Open the Studio to update', 'Abrir o Studio para atualizar', 'Abrir el Studio para actualizar', 'Ouvrir le Studio pour mettre à jour'],
		['Connect the lights to Wi-Fi to update them.', 'Liga as luzes ao Wi-Fi para as atualizar.', 'Conecta las luces al Wi-Fi para actualizarlas.', 'Connectez les lumières au Wi-Fi pour les mettre à jour.']
	];
	// sentences with numbers or names inside: [regex on the English text, PT, ES, FR] ($1, $2 = captured parts)
	const P = [
		[/^LED (\d+)$/, 'LED $1', 'LED $1', 'LED $1'],
		[/^This GIF is (\d+) KB\. The limit is 64 KB: use a smaller one \(made for LED matrices\)\.$/, 'Este GIF tem $1 KB. O limite é 64 KB: usa um mais pequeno (feito para matrizes de LEDs).', 'Este GIF ocupa $1 KB. El límite es 64 KB: usa uno más pequeño (hecho para matrices de LEDs).', 'Ce GIF fait $1 Ko. La limite est de 64 Ko : utilisez-en un plus petit (fait pour matrices LED).'],
		[/^(.+) deleted\.$/, '$1 apagado.', '$1 borrado.', '$1 supprimé.'],
		[/^Saved: this light now has its (.+) look\.$/, 'Guardado: esta luz já tem o visual de $1.', 'Guardado: esta luz ya tiene su aspecto de $1.', 'Enregistré : cette lumière a maintenant son rendu $1.'],
		[/^Downloading the update… (\d+)%$/, 'A descarregar a atualização… $1%', 'Descargando la actualización… $1%', 'Téléchargement de la mise à jour… $1 %'],
		[/^Sending to the lights… (\d+)%$/, 'A enviar para as luzes… $1%', 'Enviando a las luces… $1%', 'Envoi aux lumières… $1 %'],
		[/^Done! LED4YOU v(\d+) is running\.$/, 'Feito! O LED4YOU v$1 está a funcionar.', '¡Hecho! LED4YOU v$1 está funcionando.', 'Terminé ! LED4YOU v$1 fonctionne.'],
		[/^The update failed: (.+)$/, 'A atualização falhou: $1', 'La actualización falló: $1', 'La mise à jour a échoué : $1'],
		[/^LED4YOU v(\d+) is ready \(these lights have v(\d+)\)\.$/, 'O LED4YOU v$1 está pronto (estas luzes têm o v$2).', 'LED4YOU v$1 está listo (estas luces tienen la v$2).', 'LED4YOU v$1 est prêt (ces lumières ont la v$2).'],
		[/^LED4YOU v(\d+) is ready\.$/, 'O LED4YOU v$1 está pronto.', 'LED4YOU v$1 está listo.', 'LED4YOU v$1 est prêt.'],
		[/^LED4YOU v(\d+) is available\. Tap to update\.$/, 'O LED4YOU v$1 está disponível. Toca para atualizar.', 'LED4YOU v$1 está disponible. Toca para actualizar.', 'LED4YOU v$1 est disponible. Touchez pour mettre à jour.'],
		[/^Firmware v(\d+) is available for these lights\.$/, 'Há o firmware v$1 disponível para estas luzes.', 'Hay firmware v$1 disponible para estas luces.', 'Le firmware v$1 est disponible pour ces lumières.'],
		[/^Empty preset (\d+)$/, 'Preset $1 vazio', 'Preset $1 vacío', 'Préréglage $1 vide'],
		[/^Preset (\d+)$/, 'Preset $1', 'Preset $1', 'Préréglage $1'],
		[/^House (\d)$/, 'Casa $1', 'Casa $1', 'Maison $1'],
		[/^Color (#[0-9a-f]{6})$/i, 'Cor $1', 'Color $1', 'Couleur $1'],
		[/^(\d+) selected$/, '$1 selecionados', '$1 seleccionados', '$1 sélectionnées'],
		[/^off in (.+)$/, 'desliga em $1', 'se apaga en $1', 's’éteint dans $1'],
		[/^Now (\S+) · sunset (\S+) · sunrise (\S+)$/, 'Agora $1 · pôr do sol $2 · nascer do sol $3', 'Ahora $1 · atardecer $2 · amanecer $3', 'Maintenant $1 · coucher $2 · lever $3'],
		[/^Now (\S+) · tap "Use my location" for sunset times\.$/, 'Agora $1 · toca em "Usar a minha localização" para as horas do pôr do sol.', 'Ahora $1 · toca "Usar mi ubicación" para las horas del atardecer.', 'Maintenant $1 · touchez « Utiliser ma position » pour les heures du coucher du soleil.'],
		[/^Applied to (\d+) LEDs?\. Select others or tap "Send to lights"\.$/, 'Aplicado a $1 LED(s). Seleciona outros ou toca em "Enviar para as luzes".', 'Aplicado a $1 LED(s). Selecciona otros o toca "Enviar a las luces".', 'Appliqué à $1 LED(s). Sélectionnez-en d’autres ou touchez « Envoyer aux lumières ».'],
		[/^Saved "(.*)" to (\d+)\.$/, 'Guardado "$1" no $2.', 'Guardado "$1" en el $2.', '« $1 » enregistré sur le $2.'],
		[/^Sending… (\d+)%$/, 'A enviar… $1%', 'Enviando… $1%', 'Envoi… $1 %'],
		[/^Sending (.+?)… (\d+)%$/, 'A enviar $1… $2%', 'Enviando $1… $2%', 'Envoi de $1… $2 %'],
		[/^Sending (.+?)…$/, 'A enviar $1…', 'Enviando $1…', 'Envoi de $1…'],
		[/^Playing (.+?)\.?$/, 'A tocar $1.', 'Reproduciendo $1.', 'Lecture de $1.'],
		[/^Could not send (.+)\.$/, 'Não foi possível enviar $1.', 'No se pudo enviar $1.', 'Impossible d’envoyer $1.'],
		[/^Could not reach (.+)\.$/, 'Não foi possível chegar a $1.', 'No se pudo llegar a $1.', 'Impossible de joindre $1.'],
		[/^(.+) is on\. Save it as a preset to keep it\.$/, '$1 ligado. Guarda-o num preset para o manter.', '$1 activado. Guárdalo como preset para conservarlo.', '$1 activé. Enregistrez-le en préréglage pour le garder.'],
		[/^(.+) is on\.$/, '$1 ligado.', '$1 activado.', '$1 activé.'],
		[/^(.+) on the whole house\.$/, '$1 na casa toda.', '$1 en toda la casa.', '$1 dans toute la maison.'],
		[/^(.+): (\d+) animations stored on the lights\.$/, '$1: $2 animações guardadas nas luzes.', '$1: $2 animaciones guardadas en las luces.', '$1 : $2 animations enregistrées sur les lumières.'],
		[/^Showing (\d+) presets in a loop\.$/, 'A mostrar $1 presets em sequência.', 'Mostrando $1 presets en bucle.', '$1 préréglages en boucle.'],
		[/^Lights switch off in (.+)\.$/, 'As luzes desligam em $1.', 'Las luces se apagan en $1.', 'Les lumières s’éteignent dans $1.'],
		[/^(.+) · (\d+) LEDs$/, '$1 · $2 LEDs', '$1 · $2 LEDs', '$1 · $2 LEDs'],
		[/^(.+) · not answering$/, '$1 · não responde', '$1 · no responde', '$1 · ne répond pas'],
		[/^(\d+) channels$/, '$1 canais', '$1 canales', '$1 canaux'],
		[/^On your Wi-Fi at (.+)$/, 'No teu Wi-Fi em $1', 'En tu Wi-Fi en $1', 'Sur votre Wi-Fi à $1'],
		[/^Connected to (.+)$/, 'Ligado a $1', 'Conectado a $1', 'Connecté à $1']
	];
	if (Array.isArray(window.L4YI18N_EXTRA)) T.push(...window.L4YI18N_EXTRA);   // the board's own pages add their texts
	const idx = { pt: 1, es: 2, fr: 3 };
	const dict = { pt: new Map(), es: new Map(), fr: new Map() };
	T.forEach(r => { for (const l in idx) dict[l].set(r[0], r[idx[l]]); });

	let lang = 'en';
	try { lang = localStorage.getItem('l4yLang') || ''; } catch (e) {}
	if (!LANGS[lang]) { const n = (navigator.language || 'en').slice(0, 2); lang = LANGS[n] ? n : 'en'; }

	const tr = s => {
		if (lang === 'en' || !s) return s;
		const k = s.replace(/\s+/g, ' ').trim();
		if (!k) return s;
		const d = dict[lang].get(k);
		if (d !== undefined) return s.replace(s.trim(), d);
		for (const p of P) {
			const m = k.match(p[0]);
			if (m) return s.replace(s.trim(), p[idx[lang]].replace(/\$(\d)/g, (_, i) => dict[lang].get(m[i]) || m[i]));
		}
		return s;
	};

	// remember the English original of every text node / attribute, so the language can be switched back and forth
	const origText = new WeakMap(), shownText = new WeakMap();
	const ATTRS = ['placeholder', 'title', 'aria-label'];
	const skip = el => !el || el.closest('[data-notr]') || el.tagName === 'SCRIPT' || el.tagName === 'STYLE';
	let busy = false;
	const doText = n => {
		if (skip(n.parentElement)) return;
		if (!origText.has(n) || shownText.get(n) !== n.nodeValue) origText.set(n, n.nodeValue);   // new English text
		const out = tr(origText.get(n));
		shownText.set(n, out);
		if (n.nodeValue !== out) n.nodeValue = out;
	};
	const doAttrs = el => {
		if (skip(el)) return;
		for (const a of ATTRS) {
			if (!el.hasAttribute(a)) continue;
			const key = 'l4yEn' + a.replace('-', '');
			const v = el.getAttribute(a);
			if (el.dataset[key] === undefined || el.dataset[key + 'Out'] !== v) el.dataset[key] = v;
			const out = tr(el.dataset[key]);
			el.dataset[key + 'Out'] = out;
			if (v !== out) el.setAttribute(a, out);
		}
	};
	const walk = root => {
		if (root.nodeType === 3) { doText(root); return; }
		if (root.nodeType !== 1) return;
		doAttrs(root);
		const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
		let n;
		while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
	};
	const run = () => { busy = true; walk(document.body); busy = false; };
	const obs = new MutationObserver(list => {
		if (busy) return;
		busy = true;
		for (const m of list) {
			if (m.type === 'characterData') doText(m.target);
			else if (m.type === 'attributes') doAttrs(m.target);
			else m.addedNodes.forEach(walk);
		}
		busy = false;
	});
	const start = () => {
		document.documentElement.lang = lang;
		run();
		obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
	};
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

	const setLang = l => {
		if (!LANGS[l]) return;
		lang = l;
		try { localStorage.setItem('l4yLang', l); } catch (e) {}
		document.documentElement.lang = l;
		run();
	};
	// language menu for the page footer / header
	const picker = () => {
		const s = document.createElement('select');
		s.className = 'langpick'; s.setAttribute('aria-label', 'Language'); s.dataset.notr = '';
		for (const k in LANGS) { const o = document.createElement('option'); o.value = k; o.textContent = '🌐 ' + LANGS[k]; s.append(o); }
		s.value = lang;
		s.onchange = () => setLang(s.value);
		return s;
	};
	window.L4YI18n = { tr, setLang, picker, get lang() { return lang; }, LANGS };
})();
