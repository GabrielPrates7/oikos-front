// ÚNICO breakpoint de mobile do app — o mesmo que o Shell já usava pra trocar Sidebar por
// BottomNav. O CSS troca em `@media (min-width: 768px)` (desktop: Sidebar visível, barra
// inferior e folha "Mais" ocultas). Este valor e o CSS TÊM que ser sempre iguais: qualquer
// componente só-mobile monta condicionalmente por `useIsMobile()` E se esconde por CSS no mesmo
// ponto. Mobile = largura < 768px.
export const SHELL_DESKTOP_MIN_WIDTH_PX = 768
export const SHELL_DESKTOP_QUERY = `(min-width: ${SHELL_DESKTOP_MIN_WIDTH_PX}px)`
