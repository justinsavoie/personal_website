library(tidyverse)

diamonds
str(diamonds)
glimpse(diamonds)
View(diamonds)

# 11.3.3.1

diamonds |>
  summarise(
    min(x),
    max(x),
    mean(x),
    median(x),
    sd(x),
    min(y),
    max(y),
    mean(y),
    median(y),
    sd(y),
    min(z),
    max(z),
    mean(z),
    median(z),
    sd(z)
  )

diamonds |>
  summarise_at(
    vars(x, y, z),
    list(
      mean=mean,
      median=median,
      min=min,
      max=max)
  )

ggplot(diamonds,aes(x=x)) +
  geom_histogram()
ggplot(diamonds,aes(x=y)) +
  geom_histogram()

ggplot(diamonds,aes(x=z)) +
  geom_histogram()

summary(diamonds$x)
summary(diamonds$y)
summary(diamonds$z)

# 11.3.3.2

summary(diamonds$price)

ggplot(diamonds) +
  geom_histogram(aes(x=price),binwidth = 1000)

# 11.3.3.3

ggplot(diamonds) +
  geom_histogram(aes(x=carat))

diamonds |>
  group_by(carat) |>
  count()

# Depending on how much time left, we can do EDA on 2021 Canada Democracy Checkup
# https://dataverse.harvard.edu/dataset.xhtml?persistentId=doi:10.7910/DVN/KCIK9D
# Download Stata 14 Binary File
library(haven)
df <- read_stata("~/Downloads/DC 2021 v1.dta")

df |> 
  summarise(mean_rating_Trudeau=mean(dc21_leader_ratings_23))

df |> 
  filter(dc21_leader_ratings_23!=-99) |>
  summarise(mean_rating_Trudeau=mean(dc21_leader_ratings_23))
