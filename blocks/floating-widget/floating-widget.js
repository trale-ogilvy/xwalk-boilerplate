import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import {
  initializeWidgetSwipers,
  processHighlightExperience,
  processQuickLink,
  renderWidgetButton,
  renderWidgetContainer,
  handleEditorEnv,
  handleVisibilityOnLoad,
} from "./floating-widget-utils.js";

export default function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/floating-widget/floating-widget-author.css`
    );
    handleEditorEnv(block);
    return;
  }

  setTimeout(initializeWidgetSwipers, 1000);
  const content = [...block.children];
  const widgetIcon = content[0].querySelector("picture");
  const widgetText = content[1].querySelector("p").textContent;
  const widgetItems = content.slice(2);

  const highlightExperiences = [];
  const quickLinks = [];

  widgetItems.forEach((item) => {
    const widgetItemType = item.children[0].textContent.trim();
    switch (widgetItemType) {
      case "highlight-experience": {
        const highlightExperience = processHighlightExperience(item);
        highlightExperiences.push(highlightExperience);
        break;
      }
      case "quick-link": {
        const quickLink = processQuickLink(item);
        quickLinks.push(quickLink);
        break;
      }
      default:
        break;
    }
  });

  block.innerHTML = "";
  const widget = document.createElement("div");
  widget.className = "widget-component";

  const widgetButton = renderWidgetButton(widgetIcon, widgetText, widget);
  const widgetContainer = renderWidgetContainer(
    highlightExperiences,
    quickLinks
  );

  widget.appendChild(widgetContainer);
  widget.appendChild(widgetButton);
  block.appendChild(widget);
  const heroAiChatInput = document.querySelector(".hero-ai-chat-input");
  if (heroAiChatInput && window.innerWidth < 768) {
    widget.classList.add("hide");
  }
  handleVisibilityOnLoad(block);
}
