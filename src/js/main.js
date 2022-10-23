'use strict';

import '../css/common.css';
import '../css/search-form.css';
import '../css/gallery.css';

import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import Notiflix from 'notiflix';
import axios from 'axios';

const PIXABAY_KEY = '30808706-03d9568f6e15a5d7585f5680b';

const refs = {
  searchForm: document.querySelector('.search-form'),
  submitBtn: document.querySelector('[data-type="submit"]'),
  gallery: document.querySelector('.gallery'),
  loadMoreBtn: document.querySelector('.load-more'),
};

refs.searchForm.addEventListener('submit', onSearch);
refs.loadMoreBtn.addEventListener('click', onLoadMore);

let lightbox = new SimpleLightbox('.gallery a', {
  captionsData: 'alt',
  captionDelay: 250,
});

class QueryHandler {
  constructor() {
    this.page = 1;
    this.perPage = 50;
    this.searchQuery = '';
    this.axios = require('axios');
  }
  async fetchQueryResults() {
    try {
      const response = await axios.get(
        `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${this.searchQuery}&image_type=photo&orientation=horizontal&safesearch=true&per_page=${this.perPage}&page=${this.page}`
      );
      const data = response.data;
      this.incrementPage();
      return data;
    } catch (error) {
      console.error(error);
    }
  }
  incrementPage() {
    this.page += 1;
  }
  resetPage() {
    this.page = 1;
  }
  get query() {
    return this.searchQuery;
  }
  set query(newQuery) {
    this.searchQuery = newQuery;
  }
}

const queryHandler = new QueryHandler();

function onSearch(event) {
  event.preventDefault();
  clearGallery();
  queryHandler.query = event.currentTarget.elements.searchQuery.value.trim();
  queryHandler.resetPage();
  if (queryHandler.query === '') {
    return Notiflix.Notify.warning(
      'Please enter something for minions to start.'
    );
  }
  queryHandler
    .fetchQueryResults()
    .then(({ hits, totalHits }) => {
      if (hits.length === 0) {
        Notiflix.Notify.failure(
          'Sorry, there are no images matching your search query. Please try again.'
        );
        refs.loadMoreBtn.disabled = true;
      } else {
        const maxPage = totalHits / hits.length;
        const currentPage = queryHandler.page - 1;
        if (maxPage <= currentPage) {
          Notiflix.Notify.info(
            "We're sorry, but you've reached the end of search results."
          );
          Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
          return queryResultsMarkup(hits);
        }
        Notiflix.Notify.success(`Hooray! We found ${totalHits} images.`);
        refs.loadMoreBtn.classList.remove('visually-hidden');
        return queryResultsMarkup(hits);
      }
    })
    .catch(error => console.error(error))
    .finally(() => {
      refs.loadMoreBtn.disabled = false;
    });
}

function clearGallery() {
  refs.gallery.innerHTML = '';
}

function onLoadMore() {
  refs.loadMoreBtn.disabled = true;
  queryHandler
    .fetchQueryResults()
    .then(({ hits, totalHits }) => {
      const currentPage = queryHandler.page - 1;
      const maxPage = totalHits / queryHandler.perPage;
      if (maxPage <= currentPage) {
        Notiflix.Notify.info(
          "We're sorry, but you've reached the end of search results."
        );
        refs.loadMoreBtn.classList.add('visually-hidden');
      }
      return queryResultsMarkup(hits);
    })
    .catch(error => console.error(error))
    .finally(() => {
      refs.loadMoreBtn.disabled = false;
    });
}

function queryResultsMarkup(data) {
  refs.gallery.insertAdjacentHTML('beforeend', imageMarkup(data));
  lightbox.refresh();
  const { height: cardHeight } = document
    .querySelector('.gallery')
    .firstElementChild.getBoundingClientRect();
  window.scrollBy({
    top: cardHeight * 2,
    behavior: 'smooth',
  });
}

function imageMarkup(data) {
  const markup = data
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return /*html*/ `<a class="gallery-item" href="${largeImageURL}">
		 <div class="photo-card">
		  <img src="${webformatURL}" alt="Added tags: ${tags}" loading="lazy" width="320" height="214"/>
		  <div class="info"><p class="info-item">
		  <b>Likes:</b> ${likes}
		</p>
		<p class="info-item">
		  <b>Views:</b> ${views}
		</p>
		<p class="info-item">
		  <b>Comments:</b> ${comments}
		</p>
		<p class="info-item">
		  <b>Downloads:</b> ${downloads}
		</p>
	 </div></div></a>`;
      }
    )
    .join('');
  return markup;
}
