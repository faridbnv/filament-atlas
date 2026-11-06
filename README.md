# Filament Atlas: the built site

This repository holds the built files of Filament Atlas, served by GitHub Pages at
[pdynamics.ca/filament-atlas](https://pdynamics.ca/filament-atlas/).

Filament Atlas helps a team choose a 3D-printing filament for a Bambu Lab H2C printer. A reader gives the requirements a
part must meet. The site answers which materials can meet them and the printer can print, then which products, each
published value traced to its maker's document and page. [The method page](https://pdynamics.ca/filament-atlas/method/)
explains how the numbers are worked out.

**Do not edit this repository.** The source, the data and the build live in a private repository. Its CI replaces this
branch with one new commit on every release, so a change made here is lost. Each commit names the source commit it was
built from.

| Path | Holds |
|---|---|
| `index.html` | The selector |
| `m/` | The material pages |
| `method/` | The method |
| `data/` | The data files the pages read; each names its release |
| `assets/`, `fonts/` | Scripts, styles and fonts |
