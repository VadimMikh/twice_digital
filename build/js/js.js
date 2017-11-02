'use strict';

$(document).ready(function () {

    // First screen slider
    $('.first-slider').slick({
        arrows: false,
        dots: true,
        fade: true,
        speed: 1000,
        autoplay: true,
        autoplaySpeed: 3000
    });

    // Menu & search triggera
    $('#menu_trigger').on('click', function (e) {
        e.preventDefault();
        $('html').removeClass('search_open').toggleClass('menu_open');
    });
    $('#search_trigger').on('click', function (e) {
        e.preventDefault();
        $('html').removeClass('menu_open').toggleClass('search_open');
    });
    $('.search_close').on('click', function (e) {
        e.preventDefault();
        $('html').removeClass('search_open');
    });
    $(document).on('click', function (e) {
        if ($(e.target).closest('.search_panel').length || $(e.target).closest('header').length) {
            return;
        } else {
            $('html').removeClass('search_open').removeClass('menu_open');
        }
    });

    // Sub menu trigger
    $('.menu-list-item > a').on('click', function (e) {
        e.preventDefault();
        $(this).next('.sub_menu').length && $(this).next('.sub_menu').slideToggle(400);
    });

    // Menu custom scroll
    $('.menu').mCustomScrollbar({
        scrollInertia: 200
    });

    // Bottom slider
    $('.carousel').slick({
        centerMode: true,
        centerPadding: window.innerWidth < 480 ? '60px' : '180px',
        focusOnSelect: true
    });
});