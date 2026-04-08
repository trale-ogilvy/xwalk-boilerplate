import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
    // Process each accordion item
    Array.from(block.children).forEach((item, index) => {
      const hasContent = item.textContent.trim() !== "";
      if (!hasContent) return;
  
      // Add accordion item class to the original row
      item.className = "accordion-item";
      item.dataset.value = `item-${index + 1}`;
  
      // Get all sections of the accordion item
      const itemSections = Array.from(item.children);
  
      // Transform the first section into header
      if (itemSections[0]) {
        const headerSection = itemSections[0];
        headerSection.className = "accordion-header";
        
        // Create trigger button and move content
        const trigger = document.createElement("button");
        trigger.className = "accordion-trigger";
        
        // Move all content from header section to trigger
        while (headerSection.firstChild) {
          trigger.appendChild(headerSection.firstChild);
        }
        
        // Add the new icon
        const iconHTML = `
          <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" width="41" height="41" viewBox="0 0 41 41" fill="none">
            <mask id="mask0_${index}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="41" height="41">
              <rect x="0.675781" y="0.015625" width="40" height="40" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask0_${index})">
              <path d="M19.431 21.265H9.84766V18.765H19.431V9.18164H21.931V18.765H31.5143V21.265H21.931V30.8483H19.431V21.265Z" fill="currentColor" fill-opacity="0.8"/>
            </g>
          </svg>
        `;
        
        // Insert the icon using innerHTML
        trigger.insertAdjacentHTML('beforeend', iconHTML);
        
        // Move instrumentation from original header section to trigger
        moveInstrumentation(headerSection, trigger);
        
        // Clear header section and add trigger
        headerSection.innerHTML = '';
        headerSection.appendChild(trigger);
      }
  
      // Transform the second section into content
      if (itemSections[1]) {
        const contentSection = itemSections[1];
        contentSection.className = "accordion-content";
      }
    });
  
    // Add container class to the block itself
    block.className += ' accordion-container-item';
  
    // Add click handlers for all triggers
    const triggers = block.querySelectorAll('.accordion-trigger');
    triggers.forEach(trigger => {
      trigger.addEventListener('click', () => {
        const item = trigger.closest('.accordion-item');
        item.classList.toggle('active');
        
        // Toggle the icon rotation
        const icon = trigger.querySelector('.accordion-icon');
        if (icon) {
          icon.style.transform = item.classList.contains('active') 
            ? 'rotate(45deg)' 
            : 'rotate(0deg)';
        }
      });
    });
  }