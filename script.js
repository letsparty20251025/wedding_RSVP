// Wedding SPA JavaScript

// Global function for scrolling to sections (accessible from inline onclick)
function scrollToSection(selector) {
    // Fallback for pure JavaScript if jQuery is not available
    if (typeof $ === 'undefined') {
        const targetSection = document.querySelector(selector);
        if (targetSection) {
            const navBar = document.querySelector('.nav-bar');
            const navBarHeight = navBar ? navBar.offsetHeight : 0;
            const offsetTop = targetSection.offsetTop - navBarHeight;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
        return;
    }
    
    // Wait for jQuery to be ready
    $(document).ready(function() {
        const targetSection = $(selector);
        if (targetSection.length) {
            const navBarHeight = $('.nav-bar').length ? $('.nav-bar').height() : 0;
            const offsetTop = targetSection.offset().top - navBarHeight;
            $('html, body').animate({
                scrollTop: offsetTop
            }, 800, 'swing');
            
            // Close mobile menu if open
            if ($('.nav-menu').hasClass('active')) {
                $('.nav-menu').removeClass('active');
                $('.nav-toggle').removeClass('active');
            }
        }
    });
}

$(document).ready(function() {
    // Initialize the page
    initCountdown();
    initSmoothScrolling();
    initFormHandling();
    initNavbarScroll();
    initMobileNavToggle();
    initGalleryModal();
    initAnimations();
    preloadImages();

    // Add loading animation to page
    $('body').addClass('loaded');
});

// Countdown Timer
function initCountdown() {
    // Set the date we're counting down to (October 25, 2025)
    const weddingDate = new Date("Oct 25, 2025 17:30:00").getTime();
    
    // Update the countdown every 1 second
    const countdownTimer = setInterval(function() {
        const now = new Date().getTime();
        const distance = weddingDate - now;
        
        // Calculate time units
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Display the result
        $("#days").text(String(days).padStart(2, '0'));
        $("#hours").text(String(hours).padStart(2, '0'));
        $("#minutes").text(String(minutes).padStart(2, '0'));
        $("#seconds").text(String(seconds).padStart(2, '0'));
        
        // If the countdown is finished
        if (distance < 0) {
            clearInterval(countdownTimer);
            $("#days, #hours, #minutes, #seconds").text("00");
            $(".countdown-container").html('<h3 class="text-center">🎉 We\'re Married! 🎉</h3>');
        }
    }, 1000);
}

// Smooth scrolling for navigation
function initSmoothScrolling() {
    $('.nav-link, .cta-button').on('click', function(e) {
        const href = $(this).attr('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            scrollToSection(href);
        }
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    let lastScrollTop = 0;
    const navBar = $('.nav-bar');
    
    $(window).scroll(function() {
        const currentScrollTop = $(this).scrollTop();
        
        if (currentScrollTop > lastScrollTop && currentScrollTop > navBar.height()) {
            // Scrolling down
            navBar.addClass('nav-hidden');
        } else {
            // Scrolling up
            navBar.removeClass('nav-hidden');
        }
        lastScrollTop = currentScrollTop;
    });
}

// Mobile navigation toggle
function initMobileNavToggle() {
    $('.nav-toggle').on('click', function() {
        $('.nav-menu').toggleClass('active');
        $(this).toggleClass('active');
    });
}

// Gallery Modal
function initGalleryModal() {
    const modal = $('<div class="modal" style="display:none;"><span class="modal-close">&times;</span><div class="modal-content"><img src="" alt="Gallery Image"></div></div>');
    $('body').append(modal);

    $('.gallery-grid').on('click', '.gallery-item', function() {
        const imgSrc = $(this).find('img').attr('src');
        modal.find('img').attr('src', imgSrc);
        modal.fadeIn(300);
    });

    modal.on('click', '.modal-close', function() {
        modal.fadeOut(300);
    });

    modal.on('click', function(e) {
        if ($(e.target).is('.modal')) {
            modal.fadeOut(300);
        }
    });
}

// Form handling
function initFormHandling() {
    $('#wedding-form').on('submit', function (e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return false;
        }
        
        // Show loading state
        showLoadingState();
        
        // Hide any previous messages
        hideMessages();
        
        // Submit form
        submitForm();
    });

    // Real-time validation
    $('#wedding-form input, #wedding-form select, #wedding-form textarea').on('blur', function() {
        validateField($(this));
    });
    
    // Handle invitation field change to show/hide address field
    $('#invitation-input').on('change', function() {
        const invitationValue = $(this).val();
            const addressRow = $('#address-row');
            const addressInput = $('#address-input');
        
        if (invitationValue === 'yes') {
                addressRow.slideDown(300);
                addressInput.prop('required', true);
            } else {
                addressRow.slideUp(300);
            addressInput.prop('required', false);
            addressInput.val(''); // Clear the address field when hidden
            }
        });

    // Handle dietary field change to show/hide vegetarian meals question
    $('#dietary-input').on('change', function() {
        const dietaryValue = $(this).val();
        const vegetarianMealsRow = $('#vegetarian-meals-row');
        const vegetarianMealsInput = $('#vegetarian-meals-input');
        
        if (dietaryValue === '1') { // '1' represents 素食 (vegetarian)
            vegetarianMealsRow.slideDown(300);
            vegetarianMealsInput.prop('required', true);
        } else {
            vegetarianMealsRow.slideUp(300);
            vegetarianMealsInput.prop('required', false);
            vegetarianMealsInput.val(''); // Clear the field when hidden
        }
    });

    // Handle children seats field change to show/hide children seats count question
    $('#children-seats-input').on('change', function() {
        const childrenSeatsValue = $(this).val();
        const childrenSeatsCountRow = $('#children-seats-count-row');
        const childrenSeatsCountInput = $('#children-seats-count-input');
        
        if (childrenSeatsValue === 'yes') {
            childrenSeatsCountRow.slideDown(300);
            childrenSeatsCountInput.prop('required', true);
        } else {
            childrenSeatsCountRow.slideUp(300);
            childrenSeatsCountInput.prop('required', false);
            childrenSeatsCountInput.val(''); // Clear the field when hidden
        }
    });
}

function validateForm() {
    let isValid = true;
    const requiredFields = ['name', 'attendance'];
    
    // Add address to required fields if invitation is needed
    const invitationValue = $('#invitation-input').val();
    if (invitationValue === 'yes') {
        requiredFields.push('address');
    }
    
    // Add vegetarian meals to required fields if dietary choice is vegetarian
    const dietaryValue = $('#dietary-input').val();
    if (dietaryValue === '1') {
        requiredFields.push('vegetarian-meals');
    }
    
    // Add children seats count to required fields if children seats are needed
    const childrenSeatsValue = $('#children-seats-input').val();
    if (childrenSeatsValue === 'yes') {
        requiredFields.push('children-seats-count');
    }
    
    requiredFields.forEach(fieldName => {
        const field = $(`[name="${fieldName}"]`);
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // Email validation (if email field exists)
    const email = $('#email-input').val();
    if (email && !isValidEmail(email)) {
        showFieldError('#email-input', 'Please enter a valid email address');
        isValid = false;
    }
    
    return isValid;
}

function validateField(field) {
    const value = field.val().trim();
    const fieldName = field.attr('name');
    const isRequired = field.attr('required') === 'required';
    
    // Clear previous error state
    field.removeClass('is-invalid is-valid');
    field.next('.invalid-feedback').remove();
    
    if (isRequired && !value) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    if (value) {
        field.addClass('is-valid');
        
        // Special validation for email
        if (fieldName === 'email' && !isValidEmail(value)) {
            showFieldError(field, 'Please enter a valid email address');
            return false;
        }
    }
    
    return true;
}

function showFieldError(field, message) {
    if (typeof field === 'string') {
        field = $(field);
    }
    
    field.addClass('is-invalid');
    field.removeClass('is-valid');
    
    if (field.next('.invalid-feedback').length === 0) {
        field.after(`<div class="invalid-feedback">${message}</div>`);
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showLoadingState() {
    const submitBtn = $('.btn-submit');
    submitBtn.prop('disabled', true);
    submitBtn.find('.btn-text').text('Sending...');
    submitBtn.find('.btn-spinner').removeClass('d-none');
    $('#wedding-form').addClass('loading');
}

function hideLoadingState() {
    const submitBtn = $('.btn-submit');
    submitBtn.prop('disabled', false);
    submitBtn.find('.btn-text').text('Send RSVP');
    submitBtn.find('.btn-spinner').addClass('d-none');
    $('#wedding-form').removeClass('loading');
}

function hideMessages() {
    $('#success-message, #error-message').addClass('d-none');
}

function showSuccessMessage() {
    $('#success-message').removeClass('d-none');
    $('#error-message').addClass('d-none');
    
    // Scroll to success message
    $('html, body').animate({
        scrollTop: $('#success-message').offset().top - 100
    }, 500);
}

function showErrorMessage() {
    $('#error-message').removeClass('d-none');
    $('#success-message').addClass('d-none');
    
    // Scroll to error message
    $('html, body').animate({
        scrollTop: $('#error-message').offset().top - 100
    }, 500);
}

function submitForm() {
    // Prepare form data
    const formData = $('#wedding-form').serialize();
    
    console.log('Submitting form data:', formData);
    
    // AJAX submission to Google Apps Script
    $.ajax({
        url: "https://script.google.com/macros/s/AKfycbwe4l8LyuLhIAhAtfN7otEX1KdHf0lsdENNrDeXqrmqz4lf-ufEPHfZSKt_38ZJgZrC/exec",
        method: "POST",
        dataType: "json",
        data: formData,
        timeout: 10000, // 10 second timeout
        success: function (response) {
            console.log("Success response:", response);
            hideLoadingState();
            
            if (response.result === "success") {
                // Reset form
                resetForm();
                showSuccessMessage();
                
                // Optional: Add confetti effect
                triggerConfetti();
            } else {
                showErrorMessage();
            }
        },
        error: function (xhr, status, error) {
            console.error("Ajax error:", status, error);
            hideLoadingState();
            showErrorMessage();
        }
    });
}

function resetForm() {
    $('#wedding-form')[0].reset();
    $('#wedding-form .form-control').removeClass('is-valid is-invalid');
    $('#wedding-form .invalid-feedback').remove();
    
    // Hide address field when form is reset
    $('#address-row').hide();
    $('#address-input').prop('required', false);
    
    // Hide vegetarian meals field when form is reset
    $('#vegetarian-meals-row').hide();
    $('#vegetarian-meals-input').prop('required', false);
    
    // Hide children seats count field when form is reset
    $('#children-seats-count-row').hide();
    $('#children-seats-count-input').prop('required', false);
}

// Optional: Confetti effect for successful submission
function triggerConfetti() {
    // Simple confetti effect (you can replace this with a more sophisticated library)
    const colors = ['#8B4513', '#DEB887', '#F4A460', '#D2B48C'];
    const confettiContainer = $('<div class="confetti-container"></div>');
    $('body').append(confettiContainer);
    
    for (let i = 0; i < 50; i++) {
        const confetti = $('<div class="confetti"></div>');
        confetti.css({
            position: 'fixed',
            left: Math.random() * 100 + '%',
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            width: '10px',
            height: '10px',
            top: '-10px',
            animation: `confetti-fall ${Math.random() * 3 + 2}s linear forwards`
        });
        confettiContainer.append(confetti);
    }
    
    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
}

// Add confetti animation CSS
$('<style>').text(`
    @keyframes confetti-fall {
        0% {
            transform: translateY(-100px) rotateZ(0deg);
            opacity: 1;
        }
        100% {
            transform: translateY(100vh) rotateZ(360deg);
            opacity: 0;
        }
    }
    
    .confetti-container {
        pointer-events: none;
        z-index: 9999;
    }
`).appendTo('head');

// Intersection Observer for animations
function initAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                $(entry.target).css('animation', 'fadeInUp 0.8s ease-out forwards');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    $('.story-item, .detail-card, .gallery-item, .spotlight-item').each(function() {
        $(this).css('opacity', '0'); // Hide elements initially
        observer.observe(this);
    });
}

// Initialize animations when page loads
$(window).on('load', function() {
    initAnimations();
});

// Navbar active link highlighting
$(window).scroll(function() {
    const scrollPos = $(window).scrollTop() + 100;
    
    $('.nav-link').each(function() {
        const currLink = $(this);
        const refElement = $(currLink.attr("href"));
        
        if (refElement.length && 
            refElement.position().top <= scrollPos && 
            refElement.position().top + refElement.height() > scrollPos) {
            $('.nav-link').removeClass("active");
            currLink.addClass("active");
        } else {
            currLink.removeClass("active");
        }
    });
});

// Handle window resize for responsive countdown
$(window).resize(function() {
    // Adjust countdown layout on mobile
    if ($(window).width() < 768) {
        $('.countdown-container').addClass('mobile-layout');
    } else {
        $('.countdown-container').removeClass('mobile-layout');
    }
});

// Preload images for better performance
function preloadImages() {
    const imageUrls = [
        'static/01_cover.webp',
        'static/02_card.jpg',
        'static/03.png',
        'static/04.png',
        'static/05.png',
        'static/06.png',
        'static/07.png',
        'static/08.png',
        'static/09.png',
        'static/10.png',
        'static/11.png',
        'static/gallery/YR8-6897.jpg',
        'static/gallery/YR8-7069.jpg',
        'static/gallery/YR8-7188.jpg',
        'static/gallery/YR8-7194.jpg',
        'static/gallery/YR8-7259.jpg',
        'static/gallery/YR8-7306.jpg',
        'static/gallery/YR8-7390.jpg'
    ];
    
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
}

// Initialize preloading
preloadImages();

// Service worker registration for PWA capabilities (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment below if you create a service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Error handling for missing elements
$(document).ready(function() {
    // Check if required elements exist
    const requiredElements = ['#wedding-form', '#days', '#hours', '#minutes', '#seconds'];
    
    requiredElements.forEach(selector => {
        if ($(selector).length === 0) {
            console.warn(`Required element ${selector} not found`);
        }
    });
});

// Intersection Observer for story content animation
function initStoryAnimation() {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe all story content elements
    document.querySelectorAll('.story-content').forEach(element => {
        observer.observe(element);
    });
}

// Initialize story animation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initStoryAnimation();
});

// Export functions for testing (if needed)
// Parking Modal Functions
function openParkingModal() {
    const modal = document.getElementById('parkingModal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

function closeParkingModal() {
    const modal = document.getElementById('parkingModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
    }
}

// Close modal when pressing Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeParkingModal();
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        validateForm,
        isValidEmail,
        scrollToSection,
        openParkingModal,
        closeParkingModal
    };
}
