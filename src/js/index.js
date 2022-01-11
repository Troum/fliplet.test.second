import axios from "axios";
import Handlebars from "handlebars"
import * as rssSources from "../data/rss.json"
import "../scss/main.scss"
import functions from "./functions"

let links = rssSources.sources
let gotoPageNumber
let getDataPageNo
let data
let count
let dataCount
let rss = []

const corsURL = 'https://cors-anywhere.herokuapp.com/'

const opts = {
    pageMax: 10,
    rssDiv: document.getElementById('feeds'),
    paginationDiv: document.getElementById('pagination'),
    dataURL: null
};

const replacerUselessXMLTags = (string) => {
    return string.replace(/<!\[CDATA\[|]]>/g, '')
}

const removeGMT = (date) => {
    return new Date(date).toUTCString().split(' ').slice(0, 4).join(' ')

}

const loadPosts = (feeds) => {

    opts.rssDiv.innerHTML = "";

    feeds.forEach((item) => {
        const source = document.getElementById('rss-template').innerHTML;
        const template = Handlebars.compile(source);

        const context = {
            img: 'https://www.joomlashine.com/images/easyblog_articles/505/how-to-create-rss-feed-joomla-3x.jpg',
            title: item.title,
            content: item.content,
            link: item.link,
            date: item.date
        };
        opts.rssDiv.innerHTML += template(context);
    });
}

const showAlert = (status, id) => {
    status ?
    document.getElementById(id).classList.remove('visually-hidden') :
    document.getElementById(id).classList.add('visually-hidden')
}

const hidePrev = () => {
    document.querySelector('.pagination .pagination-prev').hidden = true
}
const showPrev = () => {
    document.querySelector('.pagination .pagination-prev').hidden = false
}

const hideNext = () => {
    document.querySelector('.pagination .pagination-next').hidden = true
}
const showNext = () => {
    document.querySelector('.pagination .pagination-next').hidden = false
}

const paginate = (page, pageCount) => {
    const source = document.getElementById('pagination-template').innerHTML;

    const template = Handlebars.compile(source);

    const context = {
        pages: functions.range(page, pageCount)
    };

    opts.paginationDiv.innerHTML = template(context)

    const pageItems = document.querySelectorAll('.pagination > li.page-item');

    document.querySelector(`[data-page="${page}"]`) ?
        document.querySelector(`[data-page="${page}"]`).classList.add('active') :
        null

    const changePage = (page) => {

        pageItems.forEach(item => {
            item.classList.remove('active')
        });

        document.querySelector(`[data-page="${page}"]`) ?
            document.querySelector(`[data-page="${page}"]`).classList.add('active') :
            null

        loadPosts(rss.slice(page * opts.pageMax - opts.pageMax, page * opts.pageMax));

        paginate(page, pageCount);

        if (gotoPageNumber <= 1) {
            hidePrev();
        }
    }

    const pageItemsLastPage = document.querySelectorAll('.pagination li').length - 2;

    document.querySelector(`[data-page="${page}"]`) ?
        document.querySelector(`[data-page="${page}"]`).classList.add('active') :
        null

    pageItems.forEach(item => {
        item.addEventListener('click', () => {

            getDataPageNo = item.getAttribute('data-page')

            changePage(getDataPageNo);

            if (getDataPageNo === 1) {
                hidePrev()
            }
            else if (getDataPageNo === pageItemsLastPage) {
                hideNext();
            }
            else {
                showPrev();
                showNext();
            }
        })
    });

    document.querySelector('.pagination > li.pagination-prev').addEventListener('click', () => {
        gotoPageNumber = parseInt(document.querySelector(`[data-page="${page}"]`).getAttribute('data-page')) - 1
        changePage(gotoPageNumber)
    })
    document.querySelector('.pagination > li.pagination-next').addEventListener('click', () => {
        gotoPageNumber = parseInt(document.querySelector(`[data-page="${page}"]`).getAttribute('data-page')) + 1

        if (gotoPageNumber > pageCount) {
            gotoPageNumber = 1;
            showPrev();
        }
        changePage(gotoPageNumber);
    })
}

const renderLinks = () => {
    const source = document.getElementById('source-links-template').innerHTML;
    const template = Handlebars.compile(source);
    document.getElementById('links').innerHTML = template({links})
}

const fetch = (url) => {
    showAlert(false, 'error-alert')
    showAlert(true, 'loading-alert')

    opts.rssDiv.innerHTML = ""
    opts.paginationDiv.innerHTML = ""
    axios.get(url, {
        headers: {
            Accept: 'application/rss+xml'
        }
    })
        .then((response) => {

            setTimeout(() => {
                data = new window.DOMParser().parseFromString(response.data, 'text/html').querySelectorAll('item')
                rss = []
                data.forEach( (item, index) => {
                    if (index < 30) {

                        rss.push({
                            title: replacerUselessXMLTags(item.querySelector('title').innerText),
                            content: replacerUselessXMLTags(item.querySelector('description') ? item.querySelector('description').innerText : ''),
                            link: item.querySelector('link').innerText,
                            date: removeGMT(item.querySelector('pubDate').innerText)
                        })
                    }
                })

                dataCount = rss.length;

                count = Math.ceil(dataCount / opts.pageMax);

                if (dataCount > opts.pageMax) {
                    paginate(1, count);

                    loadPosts(rss.slice(0, opts.pageMax))
                } else {
                    loadPosts(rss);
                }
            }, 1000)

            setTimeout(() => {
                showAlert(false, 'loading-alert')
            }, 900)
        })
        .catch(() => {
            showAlert(false, 'loading-alert')
            showAlert(true, 'error-alert')
        })
}

const getRSS = () => {
    document.querySelectorAll('[data-url]').forEach( item => {
        item.addEventListener('click', () => {
            document.querySelector('[data-url].active') ?
                document.querySelector('[data-url].active').classList.remove('active') :
                null

            item.classList.add('active')

            opts.dataURL = corsURL + item.getAttribute('data-url')

            fetch(opts.dataURL)

        }, false)
    })
}

renderLinks()
getRSS()
fetch(corsURL + 'https://feeds.bbci.co.uk/news/rss.xml')

document.querySelector('[data-url="https://feeds.bbci.co.uk/news/rss.xml"]').classList.add('active')

