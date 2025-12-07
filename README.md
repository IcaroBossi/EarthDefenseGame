# Earth Defense

Tower defense 2D em canvas onde você protege a Terra de ondas de alienígenas enquanto constrói e posiciona defesas estratégicas.

## Jogue agora
https://earthdefensegame.vercel.app

## Objetivo
- Impedir que os inimigos alcancem a base (a Terra) sobrevivendo ao máximo de ondas.
- Gerenciar recursos para comprar e posicionar torres, evoluindo a defesa a cada rodada.

## Stack utilizada
- HTML5 + Canvas para renderização 2D.
- CSS3 para UI e layout responsivo.
- JavaScript puro para lógica de jogo, spawn de inimigos e colisões.
- Web Audio API para trilha e efeitos sonoros leves.

## Estrutura rápida
- `index.html`: markup e camada de UI (HUD, seleção de torres, telas de início e game over) + carga dos scripts.
- `style.css`: estilos gerais, painel de informações, modal de guia.
- `constants.js`: dimensões, caminho dos inimigos e definições de torres/inimigos.
- `state.js`: referência ao canvas/contexto e estado global do jogo.
- `audio.js`: BGM e efeitos sonoros simples (Web Audio API).
- `particle.js`, `projectile.js`, `enemy.js`, `tower.js`: entidades visuais/lógicas.
- `script.js`: loop principal, UI, input e orquestração das entidades.

## Como jogar
1) Clique em **Começar Jogo** para iniciar a primeira onda.
2) Escolha uma torre no painel inferior e clique no mapa para posicioná-la (evite o caminho iluminado). O custo é debitado ao colocar.
3) Gerencie o dinheiro ganho ao eliminar inimigos para expandir a defesa nas próximas ondas.
4) Se os alienígenas atingirem a base, você perde vidas. Chegando a 0 vidas, aparece a tela de **Game Over** com sua pontuação e onda alcançada.

## Controles
- **Clique esquerdo no mapa**: posiciona a torre selecionada (se tiver dinheiro e espaço válido).
- **Clique na UI**: seleciona torres ou abre/fecha o guia (📘 Guia).
- **Clique em unidades**: mostra detalhes no painel inferior.