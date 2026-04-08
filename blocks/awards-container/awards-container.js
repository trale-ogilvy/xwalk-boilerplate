export default function decorate(block) {
    // Main container styling
    block.classList.add('awards-container');
    
    // Create a wrapper for proper centering
    const wrapper = document.createElement('div');
    wrapper.className = 'awards-wrapper';
    
    // Process each award item
    const awards = Array.from(block.children);
    awards.forEach((award) => {
      award.classList.add('awards-item');
  
      const sections = Array.from(award.children);
      
      if (sections.length >= 3) {
        // Image container
        sections[0].classList.add('awards-image');
        
        // Title (organization name)
        sections[1].classList.add('awards-title');
        
        // Description (award details)
        sections[2].classList.add('awards-description');
        
        // Remove any extra elements
        if (sections.length > 3) {
          sections.slice(3).forEach((extra) => extra.remove());
        }
      }
    });
    
    // Move all awards to the wrapper
    while (block.firstChild) {
      wrapper.appendChild(block.firstChild);
    }
    
    // Add wrapper to the block
    block.appendChild(wrapper);
  }