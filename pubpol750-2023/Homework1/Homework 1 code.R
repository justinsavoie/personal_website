library(readxl)
library(tidyverse)
library(lubridate)

Parliamentarians <- read_excel("~/Downloads/Parliamentarians.xlsx")

# filter by whether "MP" is in the variable `Type of Parliamentarian`
Parliamentarians <- filter(Parliamentarians,str_detect(`Type of Parliamentarian`,"MP"))

# create (mutate) variables for start and end date of the parliamentarian
# str_sub(x,5,14) returns the values between positions 5 and 14
# e.g. str_sub("abcdefghytr56",3,10) returns "cdefghyt"
# yms() coerces dates-as-string to date format 
Parliamentarians <- mutate(Parliamentarians,date_started=ymd(str_sub(`Type of Parliamentarian`,5,14)))
Parliamentarians <- mutate(Parliamentarians,date_ended=str_sub(`Type of Parliamentarian`,18,27))

# Clean and extract party and province. These are regular expressions and it's fine if it's not clear. Regular expression extract/replace data based on patterns.
# If you are curious, take a look at this:
# https://jfjelstul.github.io/regular-expressions-tutorial/
Parliamentarians <- mutate(Parliamentarians,party=trimws(str_extract(`Political Affiliation`, "[^\\()]+")))
Parliamentarians <- mutate(Parliamentarians,province=str_extract(`Province/Territory`, "[^\\\r]+"))

# Change format of date to date format
Parliamentarians <- mutate(Parliamentarians,date_ended=ymd(Parliamentarians$date_ended,quiet = TRUE))
# If no end date, Parliamentarian is still in HoC so put today as end date.
# If you are very curious, look up difference between ifelse() and if_else()
Parliamentarians <- mutate(Parliamentarians,date_ended=if_else(is.na(date_ended),ymd(today()),date_ended))

# Keep only those parties, let's not keep the small parties / indps
names_keep <- c("Conservative", "Conservative Party of Canada", "Liberal Party of Canada", 
                "New Democratic Party", "Progressive Conservative Party")
Parliamentarians <- filter(Parliamentarians, party %in% names_keep)

# Keep only variables we need
Parliamentarians <- select(Parliamentarians, Name,Gender,party,date_started,date_ended,province)

# Delete rows where missing values
Parliamentarians <- na.omit(Parliamentarians)

##### END OF CLEANING

# Make Figure 1
ggplot(Parliamentarians,aes(x=Gender)) +
  geom_bar(stat='count')
# Save Figure 1
ggsave("~/Desktop/figure1.png")

# Group by Gender and count
Parliamentarians_grouped <- group_by(Parliamentarians,Gender)
to_plot <- summarise(Parliamentarians_grouped,count=n())

# Plot and save as Figure 2
# Note: Figures 1 and 2 are the same. But figure 1 uses stat='count' and figure 2 uses stat='identity'
ggplot(to_plot,aes(x=Gender,y=count)) +
  geom_bar(stat='identity')
ggsave("~/Desktop/figure2.png")

# Create a variable called year_period by 'cutting' year in 4 periods
Parliamentarians <- mutate(Parliamentarians,year=year(date_started))
Parliamentarians <- mutate(Parliamentarians,year_period=cut(year,c(1860,1900,1950,2000,2025),dig.lab = 4))

# Plot and save figure 3
ggplot(Parliamentarians,aes(x=Gender)) +
  geom_bar() +
  facet_wrap(~year_period) + 
  scale_y_continuous(limits=c(0,1300))
ggsave("~/Desktop/figure3.png")

# Plot and save figure 4
ggplot(Parliamentarians,aes(x=Gender,fill=party)) +
  geom_bar() +
  facet_grid(cols=vars(party),rows=vars(year_period)) +
  theme(legend.position = "none") +
  scale_fill_manual(values=c("darkblue","darkblue","red","orange","darkblue"))
ggsave("~/Desktop/figure4.png")

# Recode party variable
table(Parliamentarians$party)
Parliamentarians <- mutate(Parliamentarians,party=recode(party,!!!c("Conservative Party of Canada"="Conservative",
                                                                    "Progressive Conservative Party"="Conservative")))
table(Parliamentarians$party)
ggplot(Parliamentarians,aes(x=Gender,fill=party)) +
  geom_bar() +
  facet_grid(cols=vars(party),rows=vars(year_period)) +
  theme(legend.position = "none") +
  scale_fill_manual(values=c("darkblue","red","orange"))
ggsave("~/Desktop/figure5.png")

to_plot <- Parliamentarians %>%
  group_by(Gender,party,year_period) %>%
  count()

ggplot(to_plot,aes(x=Gender,y=n,fill=party)) +
  geom_bar(stat = 'identity') +
  facet_grid(cols=vars(party),rows=vars(year_period)) +
  theme(legend.position = "none") +
  scale_fill_manual(values=c("darkblue","red","orange"))

Parliamentarians <- Parliamentarians %>%
  mutate(year_in_office=year(date_ended)-year(date_started))

Parliamentarians <- Parliamentarians %>% 
  filter(year_period!="(2000,2025]")

ggplot() +
  geom_density(data=Parliamentarians,aes(x=year_in_office))

ggplot() +
  geom_density(data=Parliamentarians%>%filter(Name!='Brecken, Frederick de St Croix'),aes(x=year_in_office))

ggplot() +
  geom_density(data=Parliamentarians%>%filter(Name!='Brecken, Frederick de St Croix'),aes(x=year_in_office,fill=Gender),alpha=0.6)

ggplot() +
  geom_density(data=Parliamentarians%>%filter(Name!='Brecken, Frederick de St Croix'),aes(x=year_in_office,fill=party)) +
  facet_grid(cols=vars(party),rows=vars(Gender))

ggplot() +
  geom_histogram(data=Parliamentarians%>%filter(Name!='Brecken, Frederick de St Croix'),aes(x=year_in_office,fill=party)) +
  facet_grid(cols=vars(party),rows=vars(Gender)) +
  scale_fill_manual(values=c("darkblue","red","orange"))
