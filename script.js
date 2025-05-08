$(document).ready(function () {
  // --- Navbar color change on scroll ---
  const navbar = $('.navbar');
  const header = $('.custom-header'); // Reference to the header

  function checkNavbarScroll() {
    // Add/remove 'navbar-scrolled' based on scroll position
    if ($(window).scrollTop() > 50) {
      navbar.addClass('navbar-scrolled');
    } else {
      navbar.removeClass('navbar-scrolled');
    }
  }

  // Initial check
  checkNavbarScroll();

  // Check on scroll and resize
  $(window).on('scroll', function () {
    checkNavbarScroll();
    animateOnScroll(); // Check animations on scroll
  });
  $(window).on('resize', function () {
    checkNavbarScroll(); // Check if navbar height changes affecting layout
    animateOnScroll(); // Check animations on resize
  });

  // --- Smooth scrolling ---
  // Targets nav links, explore button, and footer links pointing to page anchors
  $('a.nav-link, a.btn-explore, .footer-links a[href^="#"]').click(function (
    e,
  ) {
    const hash = this.hash;
    // Ensure the hash exists, isn't just "#", and the target element exists
    if (hash && hash !== '#' && $(hash).length) {
      e.preventDefault(); // Prevent default jump
      // Get current height of the fixed navbar, provide fallback
      const currentNavbarHeight = $('.navbar.fixed-top').outerHeight() || 70;
      // Calculate scroll position, subtracting navbar height
      const scrollTopPosition = $(hash).offset().top - currentNavbarHeight;
      // Animate scroll
      $('html, body').animate(
        {
          scrollTop: scrollTopPosition,
        },
        800,
      ); // Animation duration
    } else if (hash === '#') {
      // Handle links just pointing to "#" (scroll to top)
      e.preventDefault();
      $('html, body').animate({ scrollTop: 0 }, 800);
    }
    // Let external links or invalid hashes behave normally
  });

  // --- Filter functionality ---
  // Cache gallery items and the 'no posts' message element
  const $galleryItems = $('.gallery-grid .image'); // *** CHANGED: Target gallery items ***
  const $noPostsMessage = $('.no-posts');

  $('.filter-tabs .nav-link').click(function (e) {
    e.preventDefault(); // Prevent link default action

    const $this = $(this); // Cache the clicked link
    const filterValue = $this.data('filter'); // Get the category to filter by

    // Update the active state visually on the filter buttons
    $this
      .addClass('active')
      .parent()
      .siblings()
      .find('.nav-link')
      .removeClass('active');

    let $filteredItems; // To hold items that match the filter

    // Check if "All" filter is selected
    if (filterValue === 'all') {
      $filteredItems = $galleryItems; // All items match
      $noPostsMessage.stop(true, true).fadeOut(150); // Hide 'no posts' message quickly
    } else {
      // Filter the items based on the data-category attribute
      $filteredItems = $galleryItems.filter(
        '[data-category="' + filterValue + '"]',
      );
      // Select items that DON'T match the filter
      const $hiddenItems = $galleryItems.not($filteredItems);

      // Hide non-matching items first
      $hiddenItems.stop(true, true).fadeOut(150);

      // Show or hide the 'no posts' message based on filter results
      if ($filteredItems.length > 0) {
        $noPostsMessage.stop(true, true).fadeOut(150); // Hide if items found
      } else {
        $noPostsMessage.stop(true, true).fadeIn(300); // Show if no items found
      }
    }

    // Show the matching items after a brief delay (allows fadeOut to look smoother)
    setTimeout(() => {
      $filteredItems.each(function () {
        // Make sure items are ready for fadeIn and potential animation
        $(this).stop(true, true).fadeIn(300);
      });
      // Re-run animation check for newly visible items
      animateOnScroll();
    }, 160); // Delay slightly longer than fadeOut duration

    // Update the list of images available for the lightbox after filtering might complete
    setTimeout(updateVisibleImages, 400);
  });

  // --- Lightbox functionality ---
  const $overlay = $('#overlay');
  const $image = $overlay.find('img');
  const $caption = $overlay.find('#caption');
  const $prevButton = $('#prevButton');
  const $nextButton = $('#nextButton');
  const $exitButton = $('#exitButton');

  let currentImages = []; // Array to hold {src, caption} of visible images
  let currentIndex = 0; // Index of the currently displayed image in the lightbox

  // Function to update the list of images currently visible (respecting filters)
  function updateVisibleImages() {
    currentImages = []; // Reset the list
    // Select the anchor tags within VISIBLE gallery items *** CHANGED SELECTOR ***
    $('.gallery-grid .image:visible a.img-wrapper').each(function () {
      const $link = $(this);
      const src = $link.attr('href'); // Get the large image URL
      const caption =
        $link.data('caption') || $link.find('img').attr('alt') || ''; // Get caption
      if (src) {
        // Only add if a valid src exists
        currentImages.push({ src, caption });
      }
    });
    // console.log("Updated lightbox images:", currentImages.length); // For debugging
  }

  // Function to display a specific image in the lightbox by its index
  function showImage(index) {
    // Check if the index is valid within the current image list
    if (index >= 0 && index < currentImages.length) {
      currentIndex = index;
      const imgData = currentImages[currentIndex];

      $image.css('opacity', 0.5); // Show preloader effect

      // Use a temporary Image object to reliably check loading status
      const tempImg = new Image();
      tempImg.onload = function () {
        // When the image has loaded successfully
        $image.attr('src', imgData.src); // Set the src for the lightbox image
        $image.css('opacity', 1); // Fade the image in
        $caption.text(imgData.caption); // Set the caption text
      };
      tempImg.onerror = function () {
        // If the image fails to load
        $image.attr(
          'src',
          'https://placehold.co/600x400/FF0000/FFFFFF?text=Erro',
        ); // Show error placeholder
        $image.css('opacity', 1);
        $caption.text('Erro ao carregar imagem.');
      };
      tempImg.src = imgData.src; // Start loading the image

      // Show or hide navigation buttons based on whether there's more than one image
      const hasMultipleImages = currentImages.length > 1;
      $prevButton.toggle(hasMultipleImages);
      $nextButton.toggle(hasMultipleImages);
    } else {
      // Handle invalid index (e.g., if filters change rapidly)
      console.error(
        'Lightbox: Índice inválido:',
        index,
        'Total imagens:',
        currentImages.length,
      );
      closeLightbox(); // Close lightbox if index is bad
    }
  }

  // Function to open the lightbox and display the first image
  function openLightbox(startIndex) {
    showImage(startIndex); // Show the selected image
    $overlay.addClass('visible'); // Make overlay visible (triggers CSS transition)
    $('body').css('overflow', 'hidden'); // Prevent background scrolling
    $overlay.focus(); // Set focus to overlay for keyboard navigation
  }

  // Function to close the lightbox
  function closeLightbox() {
    $overlay.removeClass('visible'); // Hide overlay (triggers CSS transition)
    $('body').css('overflow', ''); // Restore background scrolling
  }

  // Event delegation: Handle clicks on image wrappers within the gallery
  // *** CHANGED DELEGATION TARGET ***
  $('#gallery').on(
    'click',
    '.gallery-grid .image a.img-wrapper',
    function (event) {
      event.preventDefault(); // Prevent default link behavior
      updateVisibleImages(); // Ensure the image list is current

      const clickedImageSrc = $(this).attr('href'); // Get the href of the clicked link
      // Find the index of the clicked image in our current list
      const startIndex = currentImages.findIndex(
        (img) => img.src === clickedImageSrc,
      );

      if (startIndex !== -1) {
        // If the image was found in the list
        openLightbox(startIndex); // Open the lightbox starting at that image
      } else {
        console.error(
          'Lightbox: Imagem clicada não encontrada na lista atual:',
          clickedImageSrc,
        );
        // Optionally show an error message to the user
      }
    },
  );

  // Close lightbox when clicking on the overlay background or the exit button
  $overlay.click(function (event) {
    if (event.target === this) {
      // Check if the click was directly on the overlay div
      closeLightbox();
    }
  });
  $exitButton.click(closeLightbox);

  // Handle lightbox navigation button clicks
  $nextButton.click(function (event) {
    event.stopPropagation(); // Prevent click from bubbling up to overlay
    // Show the next image, wrapping around to the beginning if at the end
    showImage((currentIndex + 1) % currentImages.length);
  });
  $prevButton.click(function (event) {
    event.stopPropagation(); // Prevent click from bubbling up to overlay
    // Show the previous image, wrapping around to the end if at the beginning
    showImage((currentIndex - 1 + currentImages.length) % currentImages.length);
  });

  // Handle keyboard navigation (Arrows and Escape) when the lightbox is visible
  $(document).on('keydown', function (e) {
    if ($overlay.hasClass('visible')) {
      // Only act if lightbox is open
      if (e.key === 'ArrowLeft') {
        $prevButton.filter(':visible').click(); // Trigger click only if button is visible
      } else if (e.key === 'ArrowRight') {
        $nextButton.filter(':visible').click(); // Trigger click only if button is visible
      } else if (e.key === 'Escape') {
        $exitButton.click(); // Close on Escape key
      }
    }
  });

  // --- Animate elements on scroll ---
  // Helper function to check if an element is within the viewport
  function isElementInViewport(el) {
    const element = el instanceof $ ? el[0] : el; // Handle jQuery object or DOM element
    if (!element) return false;
    const rect = element.getBoundingClientRect(); // Get element position relative to viewport
    // Check if element top is above viewport bottom and element bottom is below viewport top
    return (
      rect.top <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.bottom >= 0
    );
  }

  // Function to add animation classes to elements when they scroll into view
  function animateOnScroll() {
    // Target VISIBLE gallery items that have NOT YET been animated *** CHANGED SELECTOR ***
    $('.gallery-grid .image:visible:not(.animate__fadeInUp)').each(function () {
      const $this = $(this);
      if (isElementInViewport($this)) {
        // Add Animate.css classes to trigger the animation
        $this.addClass('animate__animated animate__fadeInUp');
      }
    });
  }

  // Initial setup after page load
  setTimeout(() => {
    // Set initial opacity for animation (if not handled by CSS)
    // Remove this line if your CSS already sets `.gallery-grid .image { opacity: 0; }`
    $('.gallery-grid .image').css('opacity', 0);

    animateOnScroll(); // Run animation check for elements visible on load
    updateVisibleImages(); // Populate the lightbox image list initially
  }, 100); // Small delay to ensure elements are rendered

  // --- Update year in footer ---
  $('#current-year').text(new Date().getFullYear());
});
