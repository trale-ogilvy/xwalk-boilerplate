export default function decorate(block) {
    block.classList.add('profile-container');
  
    const wrapper = document.createElement('div');
    wrapper.className = 'profile-wrapper';
  
    Array.from(block.children).forEach((profileCard) => {
      profileCard.classList.add('profile-card');
  
      const sections = Array.from(profileCard.children);
      
      sections.forEach((section, sectionIndex) => {
        if (!section.textContent.trim() && !section.querySelector('picture')) {
          section.remove();
          return;
        }
  
        switch(sectionIndex) {
          case 0: 
            section.classList.add('profile-image-container');
            const picture = section.querySelector('picture');
            if (picture) {
              picture.classList.add('profile-image');
            }
            break;
  
          case 1: 
            section.classList.add('profile-name');
            break;
  
          case 2: 
            section.classList.add('profile-title');
            break;
  
            case 3: 
            const buttonLink = sections[4]?.querySelector('a.button');
            if (buttonLink) {
              const actionLink = document.createElement('a');
              actionLink.href = buttonLink.getAttribute('href');
              actionLink.title = buttonLink.getAttribute('title');
              actionLink.className = 'profile-action-link';
              
              const actionContent = document.createElement('div');
              actionContent.className = 'profile-action-content';
              
              section.classList.add('profile-action-text');
              actionContent.appendChild(section.cloneNode(true));
              
              const arrowSvg = document.createElement('div');
              arrowSvg.className = 'profile-action-arrow';
              arrowSvg.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="21" height="20" viewBox="0 0 21 20" fill="none">
                  <mask id="mask0_2729_46742" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="21" height="20">
                    <rect x="0.4375" width="20" height="20" fill="#D9D9D9"/>
                  </mask>
                  <g mask="url(#mask0_2729_46742)">
                    <path d="M11.7381 9.99991L6.9375 5.19931L8.0372 4.09961L13.9375 9.99991L8.0372 15.9002L6.9375 14.8005L11.7381 9.99991Z" fill="#333333"/>
                  </g>
                </svg>
              `;
              
              actionContent.appendChild(arrowSvg);
              actionLink.appendChild(actionContent);
              
              section.replaceWith(actionLink);
              
              sections[4].remove();
            } else {
              section.classList.add('profile-action-text');
            }
            break;
  
          case 4: 
            break;
  
          default:
            section.remove();
        }
      });
  
      wrapper.appendChild(profileCard);
    });
  
    block.textContent = '';
    block.appendChild(wrapper);
  }