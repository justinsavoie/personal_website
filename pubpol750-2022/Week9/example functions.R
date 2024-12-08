library(tidyverse)

path <- "~/Downloads/resultats-section-vote2018/DGE-80.10_Abitibi-Est_Sans_SE.csv"

clean_data <- function(path){
  
  df <- read_delim(path,delim = ";",locale=locale(encoding="latin1"))
  df <- df %>%
    select(-Code,-`Date scrutin`,-Étendue,-`Nom des Municipalités`, -`Secteur`, -`Regroupement`,  -`S.V.`,  -`É.I.`,-`B.V.`,-`B.R.`) %>%
    pivot_longer(cols = -c(Circonscription))  
  
  df$party <- NA
  
  df <- df %>% mutate(party=ifelse(grepl(" P.L.Q./Q.L.P.",name),"PLQ",party))
  df <- df %>% mutate(party=ifelse(grepl(" P.Q.",name),"PQ",party))
  df <- df %>% mutate(party=ifelse(grepl(" Q.S.",name),"QS",party))
  df <- df %>% mutate(party=ifelse(grepl(" C.A.Q",name),"CAQ",party))
  
  df$party <- ifelse(is.na(df$party),"Other",df$party)
  
  
  df %>% 
    group_by(Circonscription,party) %>%
    summarise(n_votes = sum(value,na.rm=TRUE))

}

my_paths <- list.files("~/Downloads/resultats-section-vote2018/",full.names = TRUE)


list_to_fill <- list()

for (i in my_paths){
  list_to_fill[[i]] <- clean_data(i)
}

df_final <- bind_rows(list_to_fill)

df_final