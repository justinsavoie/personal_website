# Binding rows

library(tidyverse)
library(haven)
library(lubridate)

df_online <- read_stata("~/Downloads/2019 Canadian Election Study - Online Survey v1.0.dta")
df_phone <- read_stata("~/Downloads/2019 Canadian Election Study - Phone Survey v1.1.dta")

names(df_online)
names(df_phone)

df_phone <- df_phone |>
  mutate(vote_intention=coalesce(q12,q11),
         date=date(survey_end_CES))

df_online <- df_online |>
  mutate(vote_intention=coalesce(cps19_vote_unlikely,cps19_votechoice),
         date=date(cps19_EndDate))

bind_rows(
  
  df_phone |> select(vote_intention),
  
  df_online |>select(vote_intention)

)

df_phone$vote_intention
df_online$vote_intention

df_phone <- df_phone |>
  select(vote_intention,date) |>
  mutate(vote_intention_clean=recode(as.numeric(vote_intention),
                                     `-9`=NA_character_,
                                     `-8`=NA_character_,
                                     `-7`=NA_character_,
                                     `1`="LPC",
                                     `2`="CPC",
                                     `3`="NDP",
                                     `4`="BQ",
                                     `5`="GPC",
                                     `6`="PPC",
                                     `7`=NA_character_,
                                     `8`=NA_character_,
                                     `9`=NA_character_,
                                     `10`=NA_character_))

df_phone |>
  select(vote_intention,date) |>
  mutate(vote_intention_clean=as_factor(vote_intention)) |> 
  mutate(vote_intention_clean=recode(vote_intention_clean,
                                     "(-9) Don't know"=NA_character_,
                                     "(-8) Refused"=NA_character_,
                                     "(-7) Skipped"=NA_character_,
                                     "(1) Liberal (Grits)"="LPC",
                                     "(2) Conservatives (Tory, PCs, Conservative Party of Canada)"="CPC",
                                     "(3) NDP (New Democratic Party, New Democrats, NDPers)"="NDP",
                                     "(4) Bloc Québécois (BQ, PQ, Bloc, Parti Québécois)"="BQ",
                                     "(5) Green Party (Greens)"="GPC",
                                     "(6) People's Party"="PPC",
                                     "(7) Other"=NA_character_,
                                     "(8) Will not vote"=NA_character_,
                                     "(9) None of these"=NA_character_,
                                     "(10) Will spoil ballet"=NA_character_))

df_online <- df_online |>
  select(vote_intention,date) |>
  mutate(vote_intention_clean=recode(as.numeric(vote_intention),
                                     `1`="LPC",
                                     `2`="CPC",
                                     `3`="NDP",
                                     `4`="BQ",
                                     `5`="GPC",
                                     `6`="PPC",
                                     `7`=NA_character_,
                                     `9`=NA_character_))

df_online
df_phone

to_model <- bind_rows(df_online |> select(-vote_intention),
          df_phone |> select(-vote_intention))

to_plot <- to_model |>
  na.omit() |>
  group_by(date,vote_intention_clean) |>
  count() |>
  group_by(date) |>
  mutate(percent=n/sum(n)) 

ggplot(to_plot,aes(x=date,y=percent,color=vote_intention_clean)) + 
  geom_point() + geom_line() +
  scale_color_manual(values=c("BQ"="lightblue","GPC"="darkgreen","NDP"="orange",
                              "LPC"="red","CPC"="darkblue","PPC"="purple"))

table(to_model$date)

to_plot <- to_model |>
  filter(date<"2019-10-21") |>
  na.omit() |>
  group_by(date,vote_intention_clean) |>
  count() |>
  group_by(date) |>
  mutate(percent=n/sum(n)) 

ggplot(to_plot,aes(x=date,y=percent,color=vote_intention_clean)) + 
  geom_point() + geom_line() +
  scale_color_manual(values=c("BQ"="lightblue","GPC"="darkgreen","NDP"="orange",
                              "LPC"="red","CPC"="darkblue","PPC"="purple"))

# Doing a join with polls on WIKIPEDIA
# You could get this manually by copy pasting in an excel file and reading it manually
library(rvest)
page <- read_html("https://en.wikipedia.org/wiki/Opinion_polling_for_the_2019_Canadian_federal_election")
tables <- page |> html_table()

polls <- tables[[2]] |>
  slice(-1:-3) |>
  select(date=`Last dateof polling[1]`,LPC,CPC,NDP,BQ,GPC,PPC) |>
  mutate(date=mdy(date)) |>
  group_by(date) |>
  summarise_all(mean)

to_plot

polls <- polls |>
  pivot_longer(cols=c("LPC","CPC","NDP","BQ","GPC","PPC"),
               names_to = "vote_intention_clean",
               values_to = "percent") |>
  mutate(percent=percent/100)

temp <- left_join(
  to_plot |> 
    select(-n) |>
    rename(percent_CES=percent),
  polls |> 
    rename(percent_polls=percent),
  by=c("date","vote_intention_clean")) |>
  mutate(percent_pollsminusCES=percent_polls-percent_CES)

temp |>
  ggplot(aes(x=date,y=percent_pollsminusCES,color=vote_intention_clean)) +
  geom_point() + geom_line() +
  scale_color_manual(values=c("BQ"="lightblue","GPC"="darkgreen","NDP"="orange",
                              "LPC"="red","CPC"="darkblue","PPC"="purple"))

temp |>
  select(-percent_pollsminusCES) |>
  pivot_longer(cols=c("percent_CES","percent_polls")) |>
  ggplot(aes(x=date,y=value,color=vote_intention_clean)) +
  geom_point() + geom_line() +
  scale_color_manual(values=c("BQ"="lightblue","GPC"="darkgreen","NDP"="orange",
                              "LPC"="red","CPC"="darkblue","PPC"="purple")) +
  facet_wrap(~name)

temp |>
  select(-percent_pollsminusCES) |>
  pivot_longer(cols=c("percent_CES","percent_polls")) |>
  ggplot(aes(x=date,y=value,color=vote_intention_clean)) +
  geom_point() + geom_line() +
  scale_color_manual(values=c("BQ"="lightblue","GPC"="darkgreen","NDP"="orange",
                              "LPC"="red","CPC"="darkblue","PPC"="purple")) +
  facet_wrap(~name) + 
  scale_x_date(date_labels = "%b. %d", date_breaks = "7 day")
  
# Text analysis

df <- read_stata("~/Downloads/2019 Canadian Election Study - Phone Survey v1.1.dta")

df <- df |>
  mutate(province = str_replace_all(as_factor(q4), "\\(.*?\\)", "") %>%
           trimws())

unique_words <- unlist(str_split(df$q7," "))

unique_words <- str_to_lower(unique_words)

tail(sort(table(unique_words)),100)

topic1 <- c("environment","climat","environnement")
topic1 <- paste0(topic1,collapse = "|")
topic2 <- c("money","econo","conomie")
topic2 <- paste0(topic2,collapse = "|")
topic3 <- c("health","sant")
topic3 <- paste0(topic3,collapse = "|")

df <- df |>
  mutate(mii = str_to_lower(q7))

df_sub <- df |>
  select(mii,province) |>
  na.omit()

df_sub <- df_sub |>
  mutate(
    topic1 = as.numeric(str_detect(mii, topic1)),
    topic2 = as.numeric(str_detect(mii, topic2)),
    topic3 = as.numeric(str_detect(mii, topic3)),
    topic4 = as.numeric((topic1 + topic2 + topic3) == 0)
  )

df_sub |>
  group_by(province) %>%
  summarise(env=mean(topic1),ecn=mean(topic2),health=mean(topic3),other=mean(topic4)) %>%
  pivot_longer(c("env","ecn","health","other")) %>%
  ggplot(aes(x=province,y=value,fill=name)) +
  geom_bar(position="dodge",stat='identity') +
  coord_flip()
