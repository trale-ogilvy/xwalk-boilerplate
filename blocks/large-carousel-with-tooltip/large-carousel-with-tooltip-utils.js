export function handleEditorEnv(slides) {
  slides.forEach((slide) => {
    const desktopCoordinates = slide.children[1];
    const tooltipTextCoordinatesDesktop =
      desktopCoordinates.textContent.split(",");
    if (tooltipTextCoordinatesDesktop.length === 2) {
      desktopCoordinates.style.left = `${tooltipTextCoordinatesDesktop[0].trim()}%`;
      desktopCoordinates.style.top = `${tooltipTextCoordinatesDesktop[1].trim()}%`;
    }

    const mobileCoordinates = slide.children[3];
    const tooltipTextCoordinatesMobile =
      mobileCoordinates.textContent.split(",");
    if (tooltipTextCoordinatesMobile.length === 2) {
      mobileCoordinates.style.left = `${tooltipTextCoordinatesMobile[0].trim()}%`;
      mobileCoordinates.style.top = `${tooltipTextCoordinatesMobile[1].trim()}%`;
    }

    const tooltipContainer = document.createElement("div");
    tooltipContainer.className = "tooltip-container";
    const tooltipContent = [...slide.children].slice(5, 7);
    tooltipContainer.append(...tooltipContent);
    slide.append(tooltipContainer);
  });
}
