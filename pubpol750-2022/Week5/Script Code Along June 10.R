library(tidyverse)

diamonds
str(diamonds)
glimpse(diamonds)
View(diamonds)

# 7.3.4.1

diamonds %>%
  summarise(min(x),
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
            sd(z))

ggplot(diamonds,aes(x=x)) +
  geom_histogram()
ggplot(diamonds,aes(x=y)) +
  geom_histogram()

ggplot(diamonds,aes(x=z)) +
  geom_histogram()

summary(diamonds$x)
summary(diamonds$y)
summary(diamonds$z)

# 7.3.4.2

summary(diamonds$price)

ggplot(diamonds) +
  geom_histogram(aes(x=price),binwidth = 1000)

# 7.3.4.3

ggplot(diamonds) +
  geom_histogram(aes(x=carat))

diamonds %>%
  group_by(carat) %>%
  count() %>% View()