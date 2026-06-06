# E-commerce Geográfico

## Sobre o Projeto

Este projeto foi desenvolvido para a disciplina de Banco de Dados II com o objetivo de aplicar conceitos de Banco de Dados Geográfico utilizando PostgreSQL e PostGIS.

A aplicação simula um sistema de e-commerce onde usuários podem visualizar lojas próximas à sua localização. Para isso, são utilizados recursos de geolocalização e consultas espaciais que permitem calcular a distância entre usuários e estabelecimentos cadastrados.

## Tecnologias Utilizadas

* Node.js
* Express
* PostgreSQL
* PostGIS
* Docker
* HTML, CSS e JavaScript
* Leaflet

## Funcionalidades

* Cadastro de usuários
* Cadastro de lojas com coordenadas geográficas
* Armazenamento de localizações utilizando tipos espaciais do PostGIS
* Consulta de lojas próximas ao usuário
* Cálculo de distância entre usuário e loja
* Visualização das lojas em mapa interativo

## Estrutura do Projeto

backend/

* API da aplicação
* Rotas e controladores
* Integração com PostgreSQL/PostGIS

frontend/

* Interface do usuário
* Mapa interativo
* Exibição das lojas cadastradas

database/

* Scripts de criação do banco de dados
* Estrutura das tabelas
* Consultas utilizadas

## Como Executar

### Pré-requisitos

* Docker e Docker Compose instalados

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/YgorE40/ecommerce-geografico.git
```

2. Entre na pasta do projeto:

```bash
cd ecommerce-geografico
```

3. Inicie os containers:

```bash
docker-compose up -d
```

4. Acesse a aplicação pelo navegador.

## Banco de Dados Geográfico

O projeto utiliza o PostGIS para armazenar e manipular dados espaciais. As localizações dos usuários e das lojas são armazenadas utilizando o tipo geométrico Point.

Entre as funções espaciais utilizadas estão:

* ST_MakePoint
* ST_SetSRID
* ST_DistanceSphere

Essas funções permitem criar coordenadas geográficas e calcular a distância entre diferentes pontos no mapa.

## Objetivo Acadêmico

Demonstrar a utilização de bancos de dados geográficos em uma aplicação prática, explorando conceitos de geolocalização, armazenamento espacial e consultas baseadas em proximidade.

## Autor

Ygor Emanoel, Luis Guilherme, Izaque Gabriel.
