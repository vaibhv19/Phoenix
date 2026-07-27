import '@testing-library/jest-dom'

// Mock scrollIntoView because JSDOM does not implement it
window.HTMLElement.prototype.scrollIntoView = () => {}
